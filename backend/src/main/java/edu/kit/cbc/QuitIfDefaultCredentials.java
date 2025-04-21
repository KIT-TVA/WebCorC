package edu.kit.cbc;

import io.micronaut.context.DefaultApplicationContext;
import io.micronaut.context.annotation.Property;
import io.micronaut.context.event.ApplicationEventListener;
import io.micronaut.context.event.StartupEvent;
import io.micronaut.scheduling.TaskExecutors;
import io.micronaut.scheduling.annotation.Async;
import io.micronaut.scheduling.annotation.ExecuteOn;
import jakarta.inject.Singleton;
import java.util.logging.Level;
import java.util.logging.Logger;

@ExecuteOn(TaskExecutors.SCHEDULED)
@Singleton
public class QuitIfDefaultCredentials implements ApplicationEventListener<StartupEvent> {

    private static final String DEFAULT_PASSWORD = "changeme";
    private static final Logger LOGGER = Logger.getGlobal();

    @Property(name = "aws.secretKey")
    private String key;

    @Property(name = "development")
    private boolean development;


    @Override
    @Async
    public void onApplicationEvent(StartupEvent event) {
        if (development
                || !key.equals(DEFAULT_PASSWORD)) {
            return;
        }
        LOGGER.log(Level.SEVERE, "DEFAULT CREDENTIALS DETECTED IN PRODUCTION. STOPPING SERVER");
        DefaultApplicationContext ctx = (DefaultApplicationContext) event.getSource();
        ctx.stop();
        System.exit(1);
    }
}
