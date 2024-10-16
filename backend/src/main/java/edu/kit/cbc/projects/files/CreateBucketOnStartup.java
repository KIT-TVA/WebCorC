package edu.kit.cbc.projects.files;

import java.net.URI;
import java.util.logging.Logger;

import io.micronaut.context.annotation.Value;
import io.micronaut.context.event.ApplicationEventListener;
import io.micronaut.context.event.StartupEvent;
import io.micronaut.scheduling.TaskExecutors;
import io.micronaut.scheduling.annotation.Async;
import io.micronaut.scheduling.annotation.ExecuteOn;
import jakarta.inject.Singleton;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.BucketAlreadyExistsException;
import software.amazon.awssdk.services.s3.model.BucketAlreadyOwnedByYouException;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;

@ExecuteOn(TaskExecutors.SCHEDULED)
@Singleton
public class CreateBucketOnStartup implements ApplicationEventListener<StartupEvent> {

    private static String BUCKET_CREATED = "Created new bucket: %s";
    private static String BUCKET_CREATION_ERROR = "Exception occured when creating bucket %s:\n%s";

    @Value("${aws.accessKeyId}")
    private String user;

    @Value("${aws.secretKey}")
    private String key;

    @Value("${aws.region}")
    private String region;

    @Value("${aws.services.s3.endpoint-override}")
    private String endpoint;

    @Value("${micronaut.object-storage.aws.default.bucket}")
    String bucketName;

    private Logger LOGGER = Logger.getGlobal();

    @Override
    @Async
    public void onApplicationEvent(StartupEvent event) {
        S3Client client = S3Client.builder()
            .credentialsProvider(
                StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(user, key)
                )
            )
            .region(Region.of(region))
            .forcePathStyle(true)
            .endpointOverride(URI.create(endpoint))
            .build();

        try {
            client.createBucket(
                CreateBucketRequest.builder()
                    .bucket(bucketName)
                    .build()
                );
            LOGGER.info(String.format(BUCKET_CREATED, bucketName));
        } catch (BucketAlreadyExistsException | BucketAlreadyOwnedByYouException e) {
        } catch (SdkClientException e) {
            LOGGER.warning(
                String.format(
                    BUCKET_CREATION_ERROR,
                    bucketName,
                    e.getMessage()
                )
            );
        }
    }
}
