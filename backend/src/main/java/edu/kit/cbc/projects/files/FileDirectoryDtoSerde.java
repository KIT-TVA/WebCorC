package edu.kit.cbc.projects.files;

import java.io.IOException;
import java.util.Set;
import java.util.HashSet;
import java.util.Objects;

import io.micronaut.context.annotation.Primary;
import io.micronaut.core.type.Argument;
import io.micronaut.serde.Decoder;
import io.micronaut.serde.Encoder;
import io.micronaut.serde.Serde;

@Primary
public class FileDirectoryDtoSerde implements Serde<FileDirectoryDto> {
    @Override
    public FileDirectoryDto deserialize(
            Decoder decoder,
            DecoderContext context,
            Argument<? super FileDirectoryDto> type) throws IOException {

        try (Decoder innerDecoder = decoder.decodeObject(type)) {
            String key = innerDecoder.decodeKey();
            String urn = "";
            InodeType inodeType = null;
            FileType fileType = null;
            Set<FileDirectoryDto> content = null;
            while (key != null) {
                switch (key) {
                    case "urn":
                        urn = innerDecoder.decodeString();
                        break;
                    case "inodeType":
                        inodeType = InodeType.valueOf(innerDecoder.decodeString());
                        break;
                    case "fileType":
                        fileType = FileType.valueOf(innerDecoder.decodeString());
                        break;
                    case "content":
                        content = new HashSet<FileDirectoryDto>();
                        Decoder wart = innerDecoder.decodeArray();
                        while (wart.hasNextArrayValue()) {
                            content.add(deserialize(wart, context, type));
                        }
                        wart.close();
                        break;
                    default:
                        throw new IOException(String.format("UNKNOWN KEY: %s", key));
                }
                key = innerDecoder.decodeKey();
            }

            if (inodeType == InodeType.file) {
                return new FileDto(urn, fileType);
            } else if (inodeType == InodeType.directory) {
                return new DirectoryDto(urn, content);
            }
            throw new IOException("Invalid InodeType");
        }
    }

    @Override
    public void serialize(
            Encoder encoder,
            EncoderContext context,
            Argument<? extends FileDirectoryDto> type, FileDirectoryDto value
            ) throws IOException {
        Objects.requireNonNull(value, "FileDirectoryDto should not be null");

        try (Encoder obj = encoder.encodeObject(type)) {
            obj.encodeKey("urn");
            obj.encodeString(value.getUrn());
            obj.encodeKey("inodeType");
            obj.encodeString(value.getInodeType().name());
            if (value instanceof FileDto) {
                FileDto file = (FileDto) value;
                obj.encodeKey("fileType");
                obj.encodeString(file.getFileType().name());
            } else if (value instanceof DirectoryDto) {
                DirectoryDto dir = (DirectoryDto) value;
                obj.encodeKey("content");
                Encoder arr = obj.encodeArray(type);
                for (FileDirectoryDto fdd : dir.getContent()) {
                    serialize(arr, context, type, fdd);
                }
                arr.finishStructure();
            }
        }
    }
}
