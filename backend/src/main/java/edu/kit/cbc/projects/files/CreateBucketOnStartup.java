package edu.kit.cbc.projects.files;

import io.micronaut.context.event.ApplicationEventListener;
import io.micronaut.context.event.StartupEvent;
import io.micronaut.scheduling.TaskExecutors;
import io.micronaut.scheduling.annotation.Async;
import io.micronaut.scheduling.annotation.ExecuteOn;
import jakarta.inject.Singleton;
import java.util.logging.Logger;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.BucketAlreadyExistsException;
import software.amazon.awssdk.services.s3.model.BucketAlreadyOwnedByYouException;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;

@ExecuteOn(TaskExecutors.SCHEDULED)
@Singleton
public class CreateBucketOnStartup implements ApplicationEventListener<StartupEvent> {

    private static final String BUCKET_FOUND = "found bucket: %s";
    private static final String BUCKET_CREATED = "created new bucket: %s";
    private static final String BUCKET_CREATION_ERROR = "exception occured when creating bucket %s:\n%s";
    private static final Logger LOGGER = Logger.getGlobal();

    private S3ClientProvider s3ClientProvider;

    public CreateBucketOnStartup(S3ClientProvider s3ClientProvider) {
        this.s3ClientProvider = s3ClientProvider;
    }

    @Override
    @Async
    public void onApplicationEvent(StartupEvent event) {
        S3Client client = s3ClientProvider.getClient();
        String bucketName = s3ClientProvider.getBucketName();

        try {
            client.createBucket(
                    CreateBucketRequest.builder()
                            .bucket(bucketName)
                            .build()
            );
            LOGGER.info(String.format(BUCKET_CREATED, bucketName));
        } catch (BucketAlreadyExistsException | BucketAlreadyOwnedByYouException e) {
            LOGGER.info(String.format(BUCKET_FOUND, bucketName));
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
