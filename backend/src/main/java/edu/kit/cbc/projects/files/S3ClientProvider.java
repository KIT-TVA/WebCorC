package edu.kit.cbc.projects.files;

import io.micronaut.context.annotation.Property;
import jakarta.inject.Singleton;
import java.net.URI;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Singleton
public class S3ClientProvider {
    private String bucketName;
    private S3Client s3Client;

    public S3ClientProvider(
            @Property(name = "aws.accessKeyId") String user,
            @Property(name = "aws.secretKey") String key,
            @Property(name = "aws.region") String region,
            @Property(name = "aws.services.s3.endpoint-override") String endpoint,
            @Property(name = "micronaut.object-storage.aws.default.bucket") String bucketName
    ) {
        this.bucketName = bucketName;
        this.s3Client = S3Client.builder()
                .credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(user, key)
                        )
                )
                .region(Region.of(region))
                .forcePathStyle(true)
                .endpointOverride(URI.create(endpoint))
                .build();
    }

    public S3Client getClient() {
        return s3Client;
    }

    public String getBucketName() {
        return bucketName;
    }
}
