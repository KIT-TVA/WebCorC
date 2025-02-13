package edu.kit.cbc;

import java.util.logging.Level;
import java.util.logging.Logger;

import io.micronaut.context.DefaultApplicationContext;
import io.micronaut.context.annotation.Property;
import io.micronaut.context.event.ApplicationEventListener;
import io.micronaut.context.event.StartupEvent;
import io.micronaut.scheduling.TaskExecutors;
import io.micronaut.scheduling.annotation.Async;
import io.micronaut.scheduling.annotation.ExecuteOn;
import jakarta.inject.Singleton;

@ExecuteOn(TaskExecutors.SCHEDULED)
@Singleton
public class QuitIfDefaultCredentials implements ApplicationEventListener<StartupEvent> {

    private static String DEFAULT_PASSWORD = "changeme";

    @Property(name = "aws.secretKey")
    private String key;

    @Property(name = "development")
    private boolean development;

    private Logger LOGGER = Logger.getGlobal();

    @Override
    @Async
    public void onApplicationEvent(StartupEvent event) {
        if (development == true ||
            !key.equals(DEFAULT_PASSWORD)) {
            return;
        }
        LOGGER.log(Level.SEVERE, "DEFAULT CREDENTIALS DETECTED IN PRODUCTION. STOPPING SERVER");
        DefaultApplicationContext ctx = (DefaultApplicationContext) event.getSource();
        ctx.stop();
        System.exit(1);
    }
}
