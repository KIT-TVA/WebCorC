package edu.kit.cbc.editor.ratelimit;

import io.micronaut.context.annotation.ConfigurationProperties;

@ConfigurationProperties("rate-limit")
public class RateLimitConfiguration {

    private boolean enabled = true;
    private int requestsPerMinute = 10;
    private int requestsPerHour = 50;
    private boolean trustForwardedHeaders = true;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getRequestsPerMinute() {
        return requestsPerMinute;
    }

    public void setRequestsPerMinute(int requestsPerMinute) {
        this.requestsPerMinute = requestsPerMinute;
    }

    public int getRequestsPerHour() {
        return requestsPerHour;
    }

    public void setRequestsPerHour(int requestsPerHour) {
        this.requestsPerHour = requestsPerHour;
    }

    public boolean isTrustForwardedHeaders() {
        return trustForwardedHeaders;
    }

    public void setTrustForwardedHeaders(boolean trustForwardedHeaders) {
        this.trustForwardedHeaders = trustForwardedHeaders;
    }
}
