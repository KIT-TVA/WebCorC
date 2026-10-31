package edu.kit.cbc.editor.verifier;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.buffer.Unpooled;
import io.netty.channel.Channel;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.http.DefaultFullHttpResponse;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.FullHttpResponse;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpHeaderValues;
import io.netty.handler.codec.http.HttpObjectAggregator;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.HttpServerCodec;
import io.netty.handler.codec.http.HttpUtil;
import io.netty.handler.codec.http.HttpVersion;
import io.netty.handler.codec.http.QueryStringDecoder;
import io.netty.handler.codec.http.websocketx.CloseWebSocketFrame;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketServerHandshaker;
import io.netty.handler.codec.http.websocketx.WebSocketServerHandshakerFactory;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;

/**
 * An in-JVM stand-in for a Verifier, for {@link HttpVerifierClient} tests: canned HTTP responses
 * per method and path, and a scripted status stream per path that a WebSocket upgrade is
 * answered with. Records every request it receives. Netty rather than
 * {@code com.sun.net.httpserver}, which cannot upgrade a connection to a WebSocket.
 */
final class StandInVerifier implements AutoCloseable {

    /** A canned HTTP response. */
    record Response(int status, String contentType, String body) {}

    /** One received HTTP request; {@code upgrade} if it asked for a WebSocket. */
    record Request(String method, String path, String contentType, String body, boolean upgrade) {}

    /**
     * The status stream scripted for a path: text frames sent right after the handshake, then a
     * close with {@code closeCode} — or, when that is {@code null}, the connection stays open.
     */
    record StatusScript(List<String> messages, Integer closeCode) {}

    private static final Response NOT_FOUND = new Response(404, "text/plain", "no such operation");

    private final Map<String, Response> responses = new ConcurrentHashMap<>();
    private final Map<String, StatusScript> streams = new ConcurrentHashMap<>();
    private final List<Request> requests = new CopyOnWriteArrayList<>();
    private final EventLoopGroup group = new NioEventLoopGroup(1);
    private final Channel channel;

    StandInVerifier() throws InterruptedException {
        ServerBootstrap bootstrap = new ServerBootstrap()
            .group(group)
            .channel(NioServerSocketChannel.class)
            .childHandler(new ChannelInitializer<SocketChannel>() {
                @Override
                protected void initChannel(SocketChannel ch) {
                    ch.pipeline().addLast(new HttpServerCodec(), new HttpObjectAggregator(1 << 20), new Handler());
                }
            });
        channel = bootstrap.bind(new InetSocketAddress("127.0.0.1", 0)).sync().channel();
    }

    /** The base URL of the stand-in with {@code basePath} appended, for a Registry entry. */
    String url(String basePath) {
        return "http://127.0.0.1:" + ((InetSocketAddress) channel.localAddress()).getPort() + basePath;
    }

    void reset() {
        responses.clear();
        streams.clear();
        requests.clear();
    }

    void serve(String method, String path, Response response) {
        responses.put(method + " " + path, response);
    }

    void serveJson(String method, String path, String body) {
        serve(method, path, new Response(200, "application/json", body));
    }

    /** Answers a WebSocket upgrade of {@code path} with the handshake and then this script. */
    void stream(String path, StatusScript script) {
        streams.put(path, script);
    }

    List<Request> requests() {
        return requests;
    }

    List<String> requestedPaths() {
        return requests.stream().map(Request::path).toList();
    }

    @Override
    public void close() throws InterruptedException {
        channel.close().sync();
        group.shutdownGracefully(0, 100, TimeUnit.MILLISECONDS).sync();
    }

    /** One connection: plain HTTP until an upgrade is accepted, then the scripted stream. */
    private final class Handler extends SimpleChannelInboundHandler<Object> {

        private WebSocketServerHandshaker handshaker;

        @Override
        protected void channelRead0(ChannelHandlerContext ctx, Object msg) {
            if (msg instanceof FullHttpRequest request) {
                handleHttp(ctx, request);
            } else if (msg instanceof CloseWebSocketFrame frame) {
                handshaker.close(ctx.channel(), frame.retain());
            }
        }

        private void handleHttp(ChannelHandlerContext ctx, FullHttpRequest request) {
            String path = new QueryStringDecoder(request.uri()).path();
            boolean upgrade = HttpHeaderValues.WEBSOCKET.contentEqualsIgnoreCase(
                request.headers().get(HttpHeaderNames.UPGRADE, ""));
            requests.add(new Request(request.method().name(), path, request.headers().get(HttpHeaderNames.CONTENT_TYPE),
                request.content().toString(StandardCharsets.UTF_8), upgrade));
            StatusScript script = streams.get(path);
            if (upgrade && script != null) {
                String location = "ws://" + request.headers().get(HttpHeaderNames.HOST) + path;
                handshaker = new WebSocketServerHandshakerFactory(location, null, false).newHandshaker(request);
                if (handshaker == null) {
                    WebSocketServerHandshakerFactory.sendUnsupportedVersionResponse(ctx.channel());
                    return;
                }
                handshaker.handshake(ctx.channel(), request).addListener(future -> play(ctx, script));
                return;
            }
            Response canned = responses.getOrDefault(request.method().name() + " " + path, NOT_FOUND);
            FullHttpResponse response = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1,
                HttpResponseStatus.valueOf(canned.status()),
                Unpooled.copiedBuffer(canned.body(), StandardCharsets.UTF_8));
            response.headers().set(HttpHeaderNames.CONTENT_TYPE, canned.contentType());
            HttpUtil.setContentLength(response, response.content().readableBytes());
            HttpUtil.setKeepAlive(response, HttpUtil.isKeepAlive(request));
            ctx.writeAndFlush(response);
        }

        private void play(ChannelHandlerContext ctx, StatusScript script) {
            for (String message : script.messages()) {
                ctx.write(new TextWebSocketFrame(message));
            }
            if (script.closeCode() != null) {
                ctx.write(new CloseWebSocketFrame(script.closeCode(), "scripted"));
            }
            ctx.flush();
        }

        @Override
        public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
            ctx.close();
        }
    }
}
