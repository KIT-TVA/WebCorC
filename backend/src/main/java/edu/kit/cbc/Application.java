package edu.kit.cbc;

import io.micronaut.runtime.Micronaut;

public class Application {

    /**
     * This is the main entry point of the application.
     * @param args the console arguments as a String array
     */
    public static void main(String[] args) {
        Micronaut.run(Application.class, args);
    }
}
