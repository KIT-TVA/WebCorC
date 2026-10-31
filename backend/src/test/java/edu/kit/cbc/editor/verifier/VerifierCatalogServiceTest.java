package edu.kit.cbc.editor.verifier;

import io.micronaut.context.ApplicationContext;
import io.micronaut.json.tree.JsonNode;
import java.math.BigDecimal;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.logging.Handler;
import java.util.logging.Level;
import java.util.logging.LogRecord;
import java.util.logging.Logger;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Seam 2 of the Verifier Catalog spec: the Catalog service driven through a fake Verifier
 * Client. The Catalog is the Functional Verifier followed by every registered Verifier in
 * Registry order, each entry being the Registry-assigned id joined with the Self-Description
 * the client returned.
 *
 * <p>A Verifier that is <em>unreachable</em> (after the configured retries) or whose
 * Self-Description is <em>invalid</em> (does not parse, or violates the schema constraints the
 * {@link SelfDescriptionValidator} enforces) is not dropped but locked off: present in Registry
 * order, {@code enabled: false}, {@code toggleable: false}, empty settings and variables,
 * labelled {@code "<id> (offline)"}. The Catalog then carries one {@code message} naming every
 * unavailable Verifier and why, and the backend log a warning with the detailed reason.
 *
 * <p>The build runs on the executor handed to the service, so that constructing it — which
 * Micronaut does while starting the application context, before the HTTP server binds — does
 * not wait for the Verifiers; these tests hand it a same-thread executor to build synchronously,
 * except where the off-thread behaviour itself is under test.
 */
class VerifierCatalogServiceTest {

    private static final SelfDescription MINIMAL = new SelfDescription(
        "Minimal", false, null, null, null, null, null);

    private static final VerifierUnreachableException UNREACHABLE =
        new VerifierUnreachableException("Verifier could not be reached: Connection refused", null);

    private static final InvalidVerifierResponseException NOT_PARSEABLE =
        new InvalidVerifierResponseException("Verifier answered 404 instead of a Self-Description", null);

    private final List<LogRecord> logRecords = new ArrayList<>();
    private final Handler logHandler = new Handler() {
        @Override
        public void publish(LogRecord record) {
            logRecords.add(record);
        }

        @Override
        public void flush() { }

        @Override
        public void close() { }
    };

    @BeforeEach
    void captureLog() {
        Logger.getGlobal().addHandler(logHandler);
    }

    @AfterEach
    void releaseLog() {
        Logger.getGlobal().removeHandler(logHandler);
    }

    private static VerifierRegistry registryOf(String... ids) {
        List<VerifierRegistryEntry> entries = new ArrayList<>();
        for (int i = 0; i < ids.length; i++) {
            entries.add(policyEntry(i, ids[i], null, null, null, Map.of()));
        }
        return new VerifierRegistry(entries);
    }

    private static VerifierRegistry registryOf(VerifierRegistryEntry entry) {
        return new VerifierRegistry(List.of(entry));
    }

    /** A Registry entry at index 0 carrying the given policy; {@code null} fields stay unset. */
    private static VerifierRegistryEntry policyEntry(
        String id, String label, Boolean enabled, Boolean toggleable, Map<String, Map<String, Object>> settings
    ) {
        return policyEntry(0, id, label, enabled, toggleable, settings);
    }

    private static VerifierRegistryEntry policyEntry(
        int index, String id, String label, Boolean enabled, Boolean toggleable, Map<String, Map<String, Object>> settings
    ) {
        VerifierRegistryEntry entry = new VerifierRegistryEntry(index);
        entry.setId(id);
        entry.setUrl("http://" + id);
        entry.setLabel(label);
        entry.setEnabled(enabled);
        entry.setToggleable(toggleable);
        entry.setSettings(settings);
        return entry;
    }

    /** Startup configuration with {@code retries} extra attempts and no delay between them. */
    private static VerifierCatalogConfiguration retries(int retries) {
        VerifierCatalogConfiguration configuration = new VerifierCatalogConfiguration();
        configuration.setRetries(retries);
        configuration.setRetryDelay(Duration.ZERO);
        return configuration;
    }

    private static VerifierCatalog build(VerifierRegistry registry, VerifierClient client) {
        return build(registry, client, retries(0));
    }

    /** Builds the Catalog on the calling thread and returns it once built. */
    private static VerifierCatalog build(
        VerifierRegistry registry, VerifierClient client, VerifierCatalogConfiguration configuration
    ) {
        return new VerifierCatalogService(registry, client, configuration, Runnable::run)
            .catalog().toCompletableFuture().join();
    }

    private static List<String> ids(VerifierCatalog catalog) {
        return catalog.verifiers().stream().map(Verifier::id).toList();
    }

    private static Verifier entry(VerifierCatalog catalog, String id) {
        return catalog.verifiers().stream().filter(verifier -> verifier.id().equals(id)).findFirst()
            .orElseThrow(() -> new AssertionError("No Catalog entry '" + id + "' in " + ids(catalog)));
    }

    private static void assertLockedOff(Verifier verifier) {
        Assertions.assertEquals(verifier.id() + " (offline)", verifier.label(), "Fallback label");
        Assertions.assertFalse(verifier.enabled(), "Locked off: not enabled");
        Assertions.assertEquals(Boolean.FALSE, verifier.toggleable(), "Locked off: not toggleable");
        Assertions.assertEquals(List.of(), verifier.settings(), "Locked off: no settings");
        Assertions.assertEquals(List.of(), verifier.variables(), "Locked off: no variables");
        Assertions.assertNull(verifier.statusPlaceholder());
        Assertions.assertNull(verifier.allowFunctionalVariables());
    }

    private List<String> warnings() {
        return logRecords.stream()
            .filter(record -> record.getLevel().intValue() >= Level.WARNING.intValue())
            .map(LogRecord::getMessage)
            .toList();
    }

    private String warningAbout(String id) {
        return warnings().stream().filter(message -> message.contains("'" + id + "'")).findFirst()
            .orElseThrow(() -> new AssertionError("No warning about '" + id + "' in " + warnings()));
    }

    // --- Catalog assembly (unchanged contract) -------------------------------------------

    @Test
    void emptyRegistryYieldsOnlyTheFunctionalVerifier() {
        FakeVerifierClient client = new FakeVerifierClient();

        VerifierCatalog catalog = build(registryOf(), client);

        Assertions.assertNull(catalog.message());
        Assertions.assertEquals(List.of("func"), ids(catalog));
        Assertions.assertTrue(client.describedIds().isEmpty(), "Nothing to fetch");
        Verifier func = catalog.verifiers().get(0);
        Assertions.assertEquals("Functional correctness", func.label());
        Assertions.assertTrue(func.enabled());
        Assertions.assertEquals(Boolean.FALSE, func.toggleable());
        Assertions.assertTrue(func.settings().isEmpty());
        Assertions.assertTrue(func.variables().isEmpty());
        Assertions.assertNull(func.statusPlaceholder());
        Assertions.assertNull(func.allowFunctionalVariables());
    }

    @Test
    void registeredVerifiersFollowTheFunctionalVerifierInRegistryOrder() {
        FakeVerifierClient client = new FakeVerifierClient()
            .describing("sec", MINIMAL)
            .describing("eebc", MINIMAL)
            .describing("maint", MINIMAL);

        VerifierCatalog catalog = build(registryOf("sec", "eebc", "maint"), client);

        Assertions.assertEquals(List.of("func", "sec", "eebc", "maint"), ids(catalog));
        Assertions.assertEquals(List.of("sec", "eebc", "maint"), client.describedIds(),
            "Every Registry entry is fetched, by id, in Registry order");
        Assertions.assertNull(catalog.message());
        Assertions.assertEquals(List.of(), warnings());
    }

    @Test
    void mergeCarriesEveryFieldOfTheSelfDescription() {
        VerifierSetting text = new VerifierSetting("reportTitle", "text", "string", "Report title", "Title of the report",
            false, JsonNode.createStringNode("Mock verification"), null, null, null);
        VerifierSetting number = new VerifierSetting("threshold", "text", "number", "Threshold", null,
            true, JsonNode.createStringNode("50"), new BigDecimal("0.5"),
            new VerifierSetting.Range(BigDecimal.ZERO, new BigDecimal("100")), null);
        VerifierSetting select = new VerifierSetting("strategy", "select", null, "Strategy", null,
            true, JsonNode.createStringNode("strict"), null, null,
            List.of(new VerifierSetting.Option("strict", "Strict"), new VerifierSetting.Option("lenient", "Lenient")));
        VerifierSetting bool = new VerifierSetting("verbose", "boolean", null, "Verbose output", null,
            null, JsonNode.createBooleanNode(true), null, null, null);
        JsonNode variable = JsonNode.createObjectNode(Map.of(
            "id", JsonNode.createStringNode("energyBudget"),
            "type", JsonNode.createStringNode("double")));
        SelfDescription description = new SelfDescription(
            "Mock Verifier", true, true, "Waiting for mock verification",
            List.of(text, number, select, bool), List.of(variable), true);
        FakeVerifierClient client = new FakeVerifierClient().describing("mock", description);

        VerifierCatalog catalog = build(registryOf("mock"), client);

        Verifier mock = catalog.verifiers().get(1);
        Assertions.assertEquals("mock", mock.id(), "The id comes from the Registry, not the Self-Description");
        Assertions.assertEquals("Mock Verifier", mock.label());
        Assertions.assertTrue(mock.enabled());
        Assertions.assertEquals(Boolean.TRUE, mock.toggleable());
        Assertions.assertEquals("Waiting for mock verification", mock.statusPlaceholder());
        Assertions.assertEquals(List.of(text, number, select, bool), mock.settings());
        Assertions.assertEquals(List.of("reportTitle", "threshold", "strategy", "verbose"),
            mock.settings().stream().map(VerifierSetting::id).toList(), "Settings stay addressable by id");
        Assertions.assertEquals(List.of(variable), mock.variables());
        Assertions.assertEquals(Boolean.TRUE, mock.allowFunctionalVariables());
        Assertions.assertNull(catalog.message(), "A valid Self-Description with all four setting kinds passes");
    }

    @Test
    void absentSettingsAndVariablesBecomeEmptyLists() {
        FakeVerifierClient client = new FakeVerifierClient().describing("bare", MINIMAL);

        Verifier bare = build(registryOf("bare"), client).verifiers().get(1);

        Assertions.assertEquals("Minimal", bare.label());
        Assertions.assertFalse(bare.enabled());
        Assertions.assertNull(bare.toggleable(), "Omitted defaults stay omitted: the frontend supplies them");
        Assertions.assertNull(bare.statusPlaceholder());
        Assertions.assertNull(bare.allowFunctionalVariables());
        Assertions.assertEquals(List.of(), bare.settings(), "The Catalog always carries the arrays");
        Assertions.assertEquals(List.of(), bare.variables());
    }

    @Test
    void functionalVerifierComesFromTheSharedMergeStep() {
        Verifier merged = VerifierCatalogService.merge("any-id", VerifierCatalogService.FUNCTIONAL_SELF_DESCRIPTION);

        Assertions.assertEquals("any-id", merged.id(), "The id is Registry-assigned, not part of the Self-Description");
        Assertions.assertEquals("Functional correctness", merged.label());
        Assertions.assertTrue(merged.enabled());
        Assertions.assertEquals(Boolean.FALSE, merged.toggleable());
    }

    @Test
    void catalogEntriesAreImmutable() {
        VerifierCatalog catalog = build(registryOf(), new FakeVerifierClient());

        Assertions.assertThrows(UnsupportedOperationException.class, () -> catalog.verifiers().clear());
    }

    // --- Locked-off entries ---------------------------------------------------------------

    @Test
    void unreachableVerifierIsLockedOffInRegistryOrder() {
        FakeVerifierClient client = new FakeVerifierClient()
            .failing("eebc", UNREACHABLE)
            .describing("sec", MINIMAL);

        VerifierCatalog catalog = build(registryOf("eebc", "sec"), client);

        Assertions.assertEquals(List.of("func", "eebc", "sec"), ids(catalog), "Locked off, not dropped; Registry order kept");
        assertLockedOff(entry(catalog, "eebc"));
        Assertions.assertEquals("Minimal", entry(catalog, "sec").label(), "Others are unaffected");
        Assertions.assertTrue(warningAbout("eebc").contains("Connection refused"),
            "The backend log carries the detailed reason: " + warnings());
    }

    @Test
    void invalidSelfDescriptionIsLockedOffInRegistryOrder() {
        FakeVerifierClient client = new FakeVerifierClient()
            .describing("eebc", MINIMAL)
            .failing("sec", NOT_PARSEABLE);

        VerifierCatalog catalog = build(registryOf("eebc", "sec"), client);

        Assertions.assertEquals(List.of("func", "eebc", "sec"), ids(catalog));
        assertLockedOff(entry(catalog, "sec"));
        Assertions.assertTrue(warningAbout("sec").contains("answered 404"),
            "The backend log carries the detailed reason: " + warnings());
    }

    // --- Startup ------------------------------------------------------------------------------

    @Test
    void constructingDoesNotWaitForTheVerifiers() throws Exception {
        CountDownLatch verifierAnswers = new CountDownLatch(1);
        VerifierClient stalling = new FakeVerifierClient() {
            @Override
            public SelfDescription describe(String id) throws VerifierUnreachableException, InvalidVerifierResponseException {
                try {
                    verifierAnswers.await();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new VerifierUnreachableException("interrupted", e);
                }
                return MINIMAL;
            }
        };
        ExecutorService executor = Executors.newSingleThreadExecutor();
        try {
            VerifierCatalogService service =
                new VerifierCatalogService(registryOf("eebc"), stalling, retries(0), executor);
            CompletableFuture<VerifierCatalog> catalog = service.catalog().toCompletableFuture();

            Assertions.assertFalse(catalog.isDone(), "The build runs on the executor, not in the constructor");

            verifierAnswers.countDown();
            Assertions.assertEquals(List.of("func", "eebc"), ids(catalog.get(5, TimeUnit.SECONDS)),
                "The Catalog completes once the last Verifier answered");
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void everyCallerGetsTheSameCatalog() {
        FakeVerifierClient client = new FakeVerifierClient().describing("eebc", MINIMAL);
        VerifierCatalogService service =
            new VerifierCatalogService(registryOf("eebc"), client, retries(0), Runnable::run);

        Assertions.assertSame(
            service.catalog().toCompletableFuture().join(),
            service.catalog().toCompletableFuture().join(),
            "Built once, served from the cache");
        Assertions.assertEquals(1, client.calls("eebc"));
    }

    // --- Retry --------------------------------------------------------------------------------

    @Test
    void unreachableVerifierIsRetriedTheConfiguredNumberOfTimes() {
        FakeVerifierClient client = new FakeVerifierClient().failing("eebc", UNREACHABLE);

        VerifierCatalog catalog = build(registryOf("eebc"), client, retries(3));

        Assertions.assertEquals(4, client.calls("eebc"), "One attempt plus three retries");
        assertLockedOff(entry(catalog, "eebc"));
        Assertions.assertEquals("1 verifier unavailable: eebc (unreachable)", catalog.message());
    }

    @Test
    void verifierReachableOnARetryIsNotLockedOff() {
        FakeVerifierClient client = new FakeVerifierClient()
            .failingFirst(2, "eebc", UNREACHABLE)
            .describing("eebc", MINIMAL);

        VerifierCatalog catalog = build(registryOf("eebc"), client, retries(3));

        Assertions.assertEquals(3, client.calls("eebc"), "Stops retrying once the Verifier answered");
        Assertions.assertEquals("Minimal", entry(catalog, "eebc").label());
        Assertions.assertTrue(entry(catalog, "eebc").toggleable() == null, "Not locked off");
        Assertions.assertNull(catalog.message());
        Assertions.assertEquals(List.of(), warnings(), "A Verifier that came up in time is not warned about");
    }

    @Test
    void invalidSelfDescriptionIsNotRetried() {
        FakeVerifierClient client = new FakeVerifierClient().failing("sec", NOT_PARSEABLE);

        VerifierCatalog catalog = build(registryOf("sec"), client, retries(3));

        Assertions.assertEquals(1, client.calls("sec"), "Invalid is not transient: no retry");
        assertLockedOff(entry(catalog, "sec"));
    }

    @Test
    void zeroRetriesMeansASingleAttempt() {
        FakeVerifierClient client = new FakeVerifierClient().failing("eebc", UNREACHABLE);

        build(registryOf("eebc"), client, retries(0));

        Assertions.assertEquals(1, client.calls("eebc"));
    }

    // --- Message ------------------------------------------------------------------------------

    @Test
    void messageIsAbsentWhenEveryVerifierLoaded() {
        FakeVerifierClient client = new FakeVerifierClient()
            .describing("eebc", MINIMAL)
            .describing("sec", MINIMAL);

        VerifierCatalog catalog = build(registryOf("eebc", "sec"), client);

        Assertions.assertNull(catalog.message());
    }

    @Test
    void messageNamesTheOneUnavailableVerifierAndWhy() {
        FakeVerifierClient client = new FakeVerifierClient()
            .describing("eebc", MINIMAL)
            .failing("sec", NOT_PARSEABLE);

        VerifierCatalog catalog = build(registryOf("eebc", "sec"), client);

        Assertions.assertEquals("1 verifier unavailable: sec (invalid description)", catalog.message());
    }

    @Test
    void messageNamesSeveralUnavailableVerifiersInRegistryOrder() {
        FakeVerifierClient client = new FakeVerifierClient()
            .failing("eebc", UNREACHABLE)
            .describing("maint", MINIMAL)
            .failing("sec", NOT_PARSEABLE);

        VerifierCatalog catalog = build(registryOf("eebc", "maint", "sec"), client);

        Assertions.assertEquals("2 verifiers unavailable: eebc (unreachable), sec (invalid description)",
            catalog.message());
        Assertions.assertEquals(List.of("func", "eebc", "maint", "sec"), ids(catalog));
    }

    // --- Validator: one rule per test, each with its own logged reason ------------------------

    private static VerifierSetting text(String id, Boolean required, JsonNode defaultValue) {
        return new VerifierSetting(id, "text", "string", id, null, required, defaultValue, null, null, null);
    }

    /** A setting {@code s} of the given kind, labelled, with no other fields set. */
    private static VerifierSetting setting(String type, String valueType, JsonNode defaultValue,
                                           List<VerifierSetting.Option> options) {
        return new VerifierSetting("s", type, valueType, "s", null, null, defaultValue, null, null, options);
    }

    private static final List<VerifierSetting.Option> ONE_OPTION = List.of(new VerifierSetting.Option("a", "A"));

    private static SelfDescription describing(VerifierSetting... settings) {
        return new SelfDescription("Some Verifier", true, null, null, List.of(settings), null, null);
    }

    /** Builds the Catalog for one Verifier {@code sec} with the given Self-Description and asserts it is locked off. */
    private String lockedOffReason(SelfDescription description) {
        FakeVerifierClient client = new FakeVerifierClient().describing("sec", description);

        VerifierCatalog catalog = build(registryOf("sec"), client, retries(3));

        assertLockedOff(entry(catalog, "sec"));
        Assertions.assertEquals("1 verifier unavailable: sec (invalid description)", catalog.message());
        Assertions.assertEquals(1, client.calls("sec"), "An invalid Self-Description is not retried");
        return warningAbout("sec");
    }

    @Test
    void rejectsAMissingLabel() {
        String reason = lockedOffReason(new SelfDescription(" ", true, null, null, null, null, null));

        Assertions.assertTrue(reason.contains("label"), reason);
    }

    @Test
    void rejectsASettingWithoutId() {
        String reason = lockedOffReason(describing(text(null, null, null)));

        Assertions.assertTrue(reason.contains("no id"), reason);
    }

    @Test
    void rejectsASettingWithoutLabel() {
        VerifierSetting unlabelled = new VerifierSetting("s", "text", null, null, null, null, null, null, null, null);

        String reason = lockedOffReason(describing(unlabelled));

        Assertions.assertTrue(reason.contains("'s'") && reason.contains("no label"), reason);
    }

    @Test
    void rejectsAnUnknownSettingType() {
        String reason = lockedOffReason(describing(setting("slider", null, null, null)));

        Assertions.assertTrue(reason.contains("'s'") && reason.contains("slider"), reason);
    }

    @Test
    void rejectsAnUnknownValueTypeOnATextSetting() {
        String reason = lockedOffReason(describing(setting("text", "date", null, null)));

        Assertions.assertTrue(reason.contains("'s'") && reason.contains("date"), reason);
    }

    @Test
    void rejectsAValueTypeOnASelectSetting() {
        String reason = lockedOffReason(describing(setting("select", "string", null, ONE_OPTION)));

        Assertions.assertTrue(reason.contains("'s'") && reason.contains("select") && reason.contains("string"), reason);
    }

    // Each setting kind is a closed object (settings/*.yml, additionalProperties: false): a
    // property another kind declares is rejected, named in the reason.

    private static final VerifierSetting.Range SOME_RANGE = new VerifierSetting.Range(BigDecimal.ZERO, BigDecimal.TEN);

    @Test
    void rejectsRequiredOnABooleanSetting() {
        VerifierSetting flagged = new VerifierSetting("s", "boolean", null, "s", null, false,
            JsonNode.createBooleanNode(true), null, null, null);

        String reason = lockedOffReason(describing(flagged));

        Assertions.assertTrue(reason.contains("'s'") && reason.contains("boolean") && reason.contains("required"), reason);
    }

    @Test
    void rejectsOptionsOnABooleanSetting() {
        String reason = lockedOffReason(describing(setting("boolean", null, JsonNode.createBooleanNode(true), ONE_OPTION)));

        Assertions.assertTrue(reason.contains("'s'") && reason.contains("boolean") && reason.contains("options"), reason);
    }

    @Test
    void rejectsStepOnATextStringSetting() {
        VerifierSetting stepped = new VerifierSetting("s", "text", "string", "s", null, null, null,
            new BigDecimal("0.5"), null, null);

        String reason = lockedOffReason(describing(stepped));

        Assertions.assertTrue(reason.contains("'s'") && reason.contains("text/string") && reason.contains("step"), reason);
    }

    @Test
    void rejectsRangeOnASelectSetting() {
        VerifierSetting ranged = new VerifierSetting("s", "select", null, "s", null, null, null, null,
            SOME_RANGE, ONE_OPTION);

        String reason = lockedOffReason(describing(ranged));

        Assertions.assertTrue(reason.contains("'s'") && reason.contains("select") && reason.contains("range"), reason);
    }

    @Test
    void rejectsOptionsOnATextNumberSetting() {
        String reason = lockedOffReason(describing(setting("text", "number", null, ONE_OPTION)));

        Assertions.assertTrue(reason.contains("'s'") && reason.contains("text/number") && reason.contains("options"),
            reason);
    }

    @Test
    void namesEveryForeignPropertyOfASettingAtOnce() {
        VerifierSetting overloaded = new VerifierSetting("s", "boolean", null, "s", null, true,
            JsonNode.createBooleanNode(true), BigDecimal.ONE, SOME_RANGE, ONE_OPTION);

        String reason = lockedOffReason(describing(overloaded));

        Assertions.assertTrue(reason.contains("required, step, range, options"), reason);
    }

    @Test
    void rejectsARequiredSettingWithoutDefault() {
        String reason = lockedOffReason(describing(text("s", true, null)));

        Assertions.assertTrue(reason.contains("'s'") && reason.contains("required") && reason.contains("default"), reason);
    }

    @Test
    void acceptsAnOptionalSettingWithoutDefault() {
        FakeVerifierClient client = new FakeVerifierClient().describing("sec", describing(text("s", false, null)));

        VerifierCatalog catalog = build(registryOf("sec"), client);

        Assertions.assertNull(catalog.message());
        Assertions.assertEquals("Some Verifier", entry(catalog, "sec").label());
    }

    @Test
    void rejectsASelectSettingWithoutOptions() {
        String reason = lockedOffReason(describing(setting("select", null, null, List.of())));

        Assertions.assertTrue(reason.contains("'s'") && reason.contains("options"), reason);
    }

    @Test
    void rejectsABooleanSettingWithoutDefault() {
        String reason = lockedOffReason(describing(setting("boolean", null, null, null)));

        Assertions.assertTrue(reason.contains("'s'") && reason.contains("boolean") && reason.contains("default"), reason);
    }

    @Test
    void rejectsABooleanSettingWhoseDefaultIsNotABoolean() {
        String reason = lockedOffReason(describing(setting("boolean", null, JsonNode.createStringNode("true"), null)));

        Assertions.assertTrue(reason.contains("'s'") && reason.contains("boolean") && reason.contains("default"), reason);
    }

    @Test
    void rejectsAStringValuedSettingWhoseDefaultIsNotAString() {
        String reason = lockedOffReason(describing(setting("text", "number", JsonNode.createNumberNode(50), null)));

        Assertions.assertTrue(reason.contains("'s'") && reason.contains("string") && reason.contains("default"), reason);
    }

    @Test
    void rejectsDuplicateSettingIds() {
        String reason = lockedOffReason(describing(text("s", false, null), text("s", false, null)));

        Assertions.assertTrue(reason.contains("'s'") && reason.contains("more than once"), reason);
    }

    @Test
    void rejectsTwoSettingIdsThatHyphenateToTheSameKey() {
        String reason = lockedOffReason(describing(
            text("boundedNumber", false, null), text("bounded-number", false, null)));

        Assertions.assertTrue(reason.contains("'boundedNumber'") && reason.contains("'bounded-number'")
            && reason.contains("hyphenate"), reason);
    }

    @Test
    void rejectsAllowFunctionalVariablesWithoutVariables() {
        SelfDescription description = new SelfDescription("Some Verifier", true, null, null, null, List.of(), true);

        String reason = lockedOffReason(description);

        Assertions.assertTrue(reason.contains("allowFunctionalVariables") && reason.contains("variables"), reason);
    }

    @Test
    void acceptsAllowFunctionalVariablesFalseWithoutVariables() {
        SelfDescription description = new SelfDescription("Some Verifier", true, null, null, null, null, false);
        FakeVerifierClient client = new FakeVerifierClient().describing("sec", description);

        VerifierCatalog catalog = build(registryOf("sec"), client);

        Assertions.assertNull(catalog.message());
    }

    @Test
    void rejectsAMissingEnabled() {
        String reason = lockedOffReason(new SelfDescription("Some Verifier", null, null, null, null, null, null));

        Assertions.assertTrue(reason.contains("enabled") && reason.contains("missing"), reason);
    }

    /** A variable {@code v} with the given fields; {@code null} leaves a field out. */
    private static JsonNode variable(String id, String type, JsonNode description) {
        Map<String, JsonNode> fields = new HashMap<>();
        if (id != null) {
            fields.put("id", JsonNode.createStringNode(id));
        }
        if (type != null) {
            fields.put("type", JsonNode.createStringNode(type));
        }
        if (description != null) {
            fields.put("description", description);
        }
        return JsonNode.createObjectNode(fields);
    }

    private static SelfDescription declaring(JsonNode... variables) {
        return new SelfDescription("Some Verifier", true, null, null, null, List.of(variables), null);
    }

    @Test
    void rejectsAVariableThatIsNotAnObject() {
        String reason = lockedOffReason(declaring(JsonNode.createStringNode("energyBudget")));

        Assertions.assertTrue(reason.contains("variable #1") && reason.contains("not an object"), reason);
    }

    @Test
    void rejectsAVariableWithoutId() {
        String reason = lockedOffReason(declaring(variable(null, "double", null)));

        Assertions.assertTrue(reason.contains("variable #1") && reason.contains("no id"), reason);
    }

    @Test
    void rejectsAVariableWithoutType() {
        String reason = lockedOffReason(declaring(variable("v", null, null)));

        Assertions.assertTrue(reason.contains("'v'") && reason.contains("no type"), reason);
    }

    @Test
    void rejectsAVariableIdWithASpace() {
        String reason = lockedOffReason(declaring(variable("energy budget", "double", null)));

        Assertions.assertTrue(reason.contains("'energy budget'") && reason.contains("not a valid identifier"), reason);
    }

    @Test
    void rejectsAVariableIdWithALeadingDigit() {
        String reason = lockedOffReason(declaring(variable("1x", "double", null)));

        Assertions.assertTrue(reason.contains("'1x'") && reason.contains("not a valid identifier"), reason);
    }

    @Test
    void rejectsAVariableIdWithAHyphen() {
        String reason = lockedOffReason(declaring(variable("energy-budget", "double", null)));

        Assertions.assertTrue(reason.contains("'energy-budget'") && reason.contains("not a valid identifier"), reason);
    }

    @Test
    void acceptsVariableIdsThatAreValidIdentifiers() {
        FakeVerifierClient client = new FakeVerifierClient()
            .describing("sec", declaring(variable("energyBudget", "double", null), variable("_x1", "int", null)));

        VerifierCatalog catalog = build(registryOf("sec"), client);

        Assertions.assertNull(catalog.message());
    }

    @Test
    void rejectsAVariableWhoseDescriptionIsNotAString() {
        String reason = lockedOffReason(declaring(variable("v", "double", JsonNode.createNumberNode(1))));

        Assertions.assertTrue(reason.contains("'v'") && reason.contains("description") && reason.contains("string"), reason);
    }

    @Test
    void acceptsVariablesWithEveryFieldOfTheSchema() {
        JsonNode budget = variable("energyBudget", "double", JsonNode.createStringNode("Joules per run"));
        JsonNode cores = variable("cores", "int", null);
        FakeVerifierClient client = new FakeVerifierClient().describing("sec", declaring(budget, cores));

        VerifierCatalog catalog = build(registryOf("sec"), client);

        Assertions.assertNull(catalog.message());
        Assertions.assertEquals(List.of(budget, cores), entry(catalog, "sec").variables(), "Variables round-trip as declared");
    }

    @Test
    void reportsEveryViolationOfASelfDescriptionAtOnce() {
        String reason = lockedOffReason(describing(text("a", true, null), text("b", true, null)));

        Assertions.assertTrue(reason.contains("'a'") && reason.contains("'b'"),
            "An operator sees every problem at once, not one per restart: " + reason);
    }

    // --- Registry policy ------------------------------------------------------------------

    @Test
    void policyOverridesLabelEnabledAndToggleable() {
        SelfDescription description = new SelfDescription("Original", false, true, null, List.of(), List.of(), null);
        FakeVerifierClient client = new FakeVerifierClient().describing("eebc", description);
        VerifierRegistryEntry policy = policyEntry("eebc", "Renamed", true, false, Map.of());

        Verifier verifier = entry(build(registryOf(policy), client), "eebc");

        Assertions.assertEquals("Renamed", verifier.label());
        Assertions.assertTrue(verifier.enabled());
        Assertions.assertEquals(Boolean.FALSE, verifier.toggleable());
    }

    @Test
    void policyLeavesFieldsItDoesNotSetAtTheSelfDescriptionsValues() {
        SelfDescription description = new SelfDescription("Original", true, null, null, List.of(), List.of(), null);
        FakeVerifierClient client = new FakeVerifierClient().describing("eebc", description);
        VerifierRegistryEntry policy = policyEntry("eebc", null, null, null, Map.of());

        Verifier verifier = entry(build(registryOf(policy), client), "eebc");

        Assertions.assertEquals("Original", verifier.label());
        Assertions.assertTrue(verifier.enabled());
        Assertions.assertNull(verifier.toggleable(), "Unset in policy, unset in the Self-Description: stays unset");
    }

    @Test
    void policyOverridesASettingDefaultById() {
        VerifierSetting threshold = new VerifierSetting("threshold", "text", "number", "Threshold", null,
            true, JsonNode.createStringNode("50"), null, null, null);
        VerifierSetting untouched = new VerifierSetting("verbose", "boolean", null, "Verbose", null,
            null, JsonNode.createBooleanNode(false), null, null, null);
        SelfDescription description = new SelfDescription(
            "Mock", true, null, null, List.of(threshold, untouched), List.of(), null);
        FakeVerifierClient client = new FakeVerifierClient().describing("mock", description);
        VerifierRegistryEntry policy = policyEntry("mock", null, null, null,
            Map.of("threshold", Map.of("default", "75")));

        Verifier verifier = entry(build(registryOf(policy), client), "mock");

        Assertions.assertEquals(JsonNode.createStringNode("75"),
            verifier.settings().stream().filter(s -> s.id().equals("threshold")).findFirst().orElseThrow().defaultValue());
        Assertions.assertEquals(untouched,
            verifier.settings().stream().filter(s -> s.id().equals("verbose")).findFirst().orElseThrow(),
            "A setting the policy does not name is untouched");
    }

    @Test
    void unknownSettingIdInPolicyIsWarnedAboutAndIgnored() {
        SelfDescription description = new SelfDescription("Mock", true, null, null, List.of(), List.of(), null);
        FakeVerifierClient client = new FakeVerifierClient().describing("mock", description);
        VerifierRegistryEntry policy = policyEntry("mock", null, null, null,
            Map.of("typo", Map.of("default", "x")));

        VerifierCatalog catalog = build(registryOf(policy), client);

        Assertions.assertNull(catalog.message(), "An unknown setting id in policy is a warning, not an unavailability");
        Assertions.assertTrue(warningAbout("mock").contains("typo"), warningAbout("mock"));
    }

    // --- Registry policy: a camelCase setting id survives real configuration binding -----------

    /**
     * Beans stay lazy so the {@code @Context} {@link VerifierCatalogService} does not start and
     * call out over HTTP.
     *
     * <p>Built with this test's log handler detached: starting a real {@link ApplicationContext}
     * runs the application's own startup listeners (e.g. bucket provisioning), which log to the
     * same global logger {@link #warnings()} reads and have nothing to do with the Registry
     * policy this test is about.
     */
    private ApplicationContext contextWithRegistryProperties(Map<String, Object> properties) {
        Logger.getGlobal().removeHandler(logHandler);
        try {
            return ApplicationContext.builder()
                .packages("edu.kit.cbc.editor.verifier")
                .eagerInitSingletons(false)
                .properties(properties)
                .build()
                .start();
        } finally {
            Logger.getGlobal().addHandler(logHandler);
        }
    }

    /** A {@code @Property}-style source hyphenates the camelCase setting id; the override must still apply. */
    @Test
    void wellTypedCamelCaseOverrideBoundThroughARealContextIsApplied() {
        VerifierSetting boundedNumberSetting = new VerifierSetting("boundedNumberSetting", "text", "number",
            "Bounded number", null, true, JsonNode.createStringNode("50"), null, null, null);
        SelfDescription description = new SelfDescription(
            "Mock", true, null, null, List.of(boundedNumberSetting), List.of(), null);
        FakeVerifierClient client = new FakeVerifierClient().describing("mock", description);

        try (ApplicationContext context = contextWithRegistryProperties(Map.of(
                "verifiers[0].id", "mock",
                "verifiers[0].url", "http://mock",
                "verifiers[0].settings.boundedNumberSetting.default", "75"))) {
            VerifierCatalog catalog = build(context.getBean(VerifierRegistry.class), client);

            Assertions.assertEquals(JsonNode.createStringNode("75"), defaultOf(catalog, "boundedNumberSetting"));
            Assertions.assertNull(catalog.message());
            Assertions.assertEquals(List.of(), warnings());
        }
    }

    @Test
    void wrongTypedCamelCaseOverrideBoundThroughARealContextIsIgnoredWithAWarning() {
        VerifierSetting boundedNumberSetting = new VerifierSetting("boundedNumberSetting", "text", "number",
            "Bounded number", null, true, JsonNode.createStringNode("50"), null, null, null);
        SelfDescription description = new SelfDescription(
            "Mock", true, null, null, List.of(boundedNumberSetting), List.of(), null);
        FakeVerifierClient client = new FakeVerifierClient().describing("mock", description);

        try (ApplicationContext context = contextWithRegistryProperties(Map.of(
                "verifiers[0].id", "mock",
                "verifiers[0].url", "http://mock",
                "verifiers[0].settings.boundedNumberSetting.default", 75))) {
            VerifierCatalog catalog = build(context.getBean(VerifierRegistry.class), client);

            Assertions.assertEquals(JsonNode.createStringNode("50"), defaultOf(catalog, "boundedNumberSetting"),
                "Unquoted -> bound as a number, which a text/number setting's string default rule rejects; "
                    + "the Verifier's own default is kept");
            Assertions.assertNull(catalog.message(), "A bad override is a warning, not an unavailability");
            String warning = warningAbout("mock");
            Assertions.assertTrue(warning.contains("'boundedNumberSetting'") && warning.contains("ignored"), warning);
        }
    }

    // --- Registry policy: setting-default overrides are checked against the setting's kind ----

    private static final VerifierSetting THRESHOLD = new VerifierSetting("threshold", "text", "number", "Threshold",
        null, true, JsonNode.createStringNode("50"), null, null, null);
    private static final VerifierSetting VERBOSE = new VerifierSetting("verbose", "boolean", null, "Verbose", null,
        null, JsonNode.createBooleanNode(false), null, null, null);
    private static final VerifierSetting STRATEGY = new VerifierSetting("strategy", "select", null, "Strategy", null,
        null, JsonNode.createStringNode("a"), null, null,
        List.of(new VerifierSetting.Option("a", "A"), new VerifierSetting.Option("b", "B")));

    /** Builds the Catalog for one Verifier {@code mock} declaring {@code settings}, under the given per-setting policy. */
    private VerifierCatalog policed(Map<String, Map<String, Object>> settingPolicy, VerifierSetting... settings) {
        SelfDescription description = new SelfDescription("Mock", true, null, null, List.of(settings), List.of(), null);
        FakeVerifierClient client = new FakeVerifierClient().describing("mock", description);
        return build(registryOf(policyEntry("mock", null, null, null, settingPolicy)), client);
    }

    private static JsonNode defaultOf(VerifierCatalog catalog, String settingId) {
        return entry(catalog, "mock").settings().stream().filter(s -> s.id().equals(settingId)).findFirst()
            .orElseThrow(() -> new AssertionError("No setting '" + settingId + "'")).defaultValue();
    }

    @Test
    void numberOverrideOnATextSettingIsRejectedInFavourOfTheVerifiersDefault() {
        VerifierCatalog catalog = policed(Map.of("threshold", Map.of("default", 75)), THRESHOLD);

        Assertions.assertEquals(JsonNode.createStringNode("50"), defaultOf(catalog, "threshold"),
            "A text/number setting's default is a string per the schema; the unquoted override is not");
        Assertions.assertNull(catalog.message(), "A bad override is a warning, not an unavailability");
        String warning = warningAbout("mock");
        Assertions.assertTrue(warning.contains("'threshold'") && warning.contains("string") && warning.contains("ignored"),
            warning);
    }

    @Test
    void stringOverrideOnABooleanSettingIsRejectedInFavourOfTheVerifiersDefault() {
        VerifierCatalog catalog = policed(Map.of("verbose", Map.of("default", "true")), VERBOSE);

        Assertions.assertEquals(JsonNode.createBooleanNode(false), defaultOf(catalog, "verbose"));
        Assertions.assertNull(catalog.message());
        String warning = warningAbout("mock");
        Assertions.assertTrue(warning.contains("'verbose'") && warning.contains("boolean") && warning.contains("ignored"),
            warning);
    }

    @Test
    void numberOverrideOnASelectSettingIsRejectedInFavourOfTheVerifiersDefault() {
        VerifierCatalog catalog = policed(Map.of("strategy", Map.of("default", 1)), STRATEGY);

        Assertions.assertEquals(JsonNode.createStringNode("a"), defaultOf(catalog, "strategy"));
        Assertions.assertNull(catalog.message());
        String warning = warningAbout("mock");
        Assertions.assertTrue(warning.contains("'strategy'") && warning.contains("string") && warning.contains("ignored"),
            warning);
    }

    @Test
    void wellTypedOverridesAreAppliedWithoutAWarning() {
        VerifierCatalog catalog = policed(Map.of(
            "threshold", Map.of("default", "75"),
            "verbose", Map.of("default", true),
            "strategy", Map.of("default", "b")), THRESHOLD, VERBOSE, STRATEGY);

        Assertions.assertEquals(JsonNode.createStringNode("75"), defaultOf(catalog, "threshold"));
        Assertions.assertEquals(JsonNode.createBooleanNode(true), defaultOf(catalog, "verbose"));
        Assertions.assertEquals(JsonNode.createStringNode("b"), defaultOf(catalog, "strategy"));
        Assertions.assertNull(catalog.message());
        Assertions.assertEquals(List.of(), warnings());
    }

    @Test
    void wellTypedOverrideRescuesATextSettingWhoseOwnDefaultIsNotAString() {
        VerifierSetting threshold = THRESHOLD.withDefault(JsonNode.createNumberNode(50));

        VerifierCatalog catalog = policed(Map.of("threshold", Map.of("default", "75")), threshold);

        Assertions.assertNull(catalog.message(), "Not locked off: the Registry override stands in for the flawed default");
        Assertions.assertEquals(JsonNode.createStringNode("75"), defaultOf(catalog, "threshold"));
        Assertions.assertEquals("Mock", entry(catalog, "mock").label());
        String warning = warningAbout("mock");
        Assertions.assertTrue(warning.contains("'threshold'") && warning.contains("string") && warning.contains("override"),
            warning);
    }

    @Test
    void wellTypedOverrideRescuesARequiredSettingWithoutDefault() {
        VerifierSetting threshold = THRESHOLD.withDefault(null);

        VerifierCatalog catalog = policed(Map.of("threshold", Map.of("default", "75")), threshold);

        Assertions.assertNull(catalog.message());
        Assertions.assertEquals(JsonNode.createStringNode("75"), defaultOf(catalog, "threshold"));
        String warning = warningAbout("mock");
        Assertions.assertTrue(warning.contains("'threshold'") && warning.contains("required") && warning.contains("override"),
            warning);
    }

    @Test
    void wellTypedOverrideRescuesABooleanSettingWhoseOwnDefaultIsNotABoolean() {
        VerifierSetting verbose = VERBOSE.withDefault(JsonNode.createStringNode("false"));

        VerifierCatalog catalog = policed(Map.of("verbose", Map.of("default", true)), verbose);

        Assertions.assertNull(catalog.message());
        Assertions.assertEquals(JsonNode.createBooleanNode(true), defaultOf(catalog, "verbose"));
        String warning = warningAbout("mock");
        Assertions.assertTrue(warning.contains("'verbose'") && warning.contains("boolean") && warning.contains("override"),
            warning);
    }

    @Test
    void illTypedOverrideDoesNotRescueAFlawedDefault() {
        VerifierSetting verbose = VERBOSE.withDefault(JsonNode.createStringNode("false"));

        VerifierCatalog catalog = policed(Map.of("verbose", Map.of("default", "true")), verbose);

        Assertions.assertEquals("1 verifier unavailable: mock (invalid description)", catalog.message());
        assertLockedOff(entry(catalog, "mock"));
        Assertions.assertTrue(warningAbout("mock").contains("'verbose'"), warningAbout("mock"));
    }

    @Test
    void overrideRescuesOnlyTheSettingItNames() {
        VerifierSetting verbose = VERBOSE.withDefault(null);

        VerifierCatalog catalog = policed(Map.of("threshold", Map.of("default", "75")), THRESHOLD, verbose);

        Assertions.assertEquals("1 verifier unavailable: mock (invalid description)", catalog.message());
        assertLockedOff(entry(catalog, "mock"));
    }

    // --- Registry policy: overrides must also fit the setting's range, step and options -------

    private static final VerifierSetting BOUNDED = new VerifierSetting("bounded", "text", "number", "Bounded", null,
        true, JsonNode.createStringNode("50"), new BigDecimal("0.5"),
        new VerifierSetting.Range(BigDecimal.ZERO, new BigDecimal("100")), null);

    @Test
    void outOfRangeOverrideIsIgnoredInFavourOfTheVerifiersDefault() {
        VerifierCatalog catalog = policed(Map.of("bounded", Map.of("default", "500")), BOUNDED);

        Assertions.assertEquals(JsonNode.createStringNode("50"), defaultOf(catalog, "bounded"));
        Assertions.assertNull(catalog.message(), "A bad override is a warning, not an unavailability");
        String warning = warningAbout("mock");
        Assertions.assertTrue(warning.contains("'bounded'") && warning.contains("above its maximum 100")
            && warning.contains("ignored"), warning);
    }

    @Test
    void emptyOverrideOnARequiredSettingIsIgnoredInFavourOfTheVerifiersDefault() {
        VerifierCatalog catalog = policed(Map.of("bounded", Map.of("default", "")), BOUNDED);

        Assertions.assertEquals(JsonNode.createStringNode("50"), defaultOf(catalog, "bounded"));
        Assertions.assertNull(catalog.message());
        String warning = warningAbout("mock");
        Assertions.assertTrue(warning.contains("'bounded'") && warning.contains("required")
            && warning.contains("ignored"), warning);
    }

    @Test
    void notAnOptionOverrideIsIgnoredInFavourOfTheVerifiersDefault() {
        VerifierCatalog catalog = policed(Map.of("strategy", Map.of("default", "c")), STRATEGY);

        Assertions.assertEquals(JsonNode.createStringNode("a"), defaultOf(catalog, "strategy"));
        String warning = warningAbout("mock");
        Assertions.assertTrue(warning.contains("'strategy'") && warning.contains("not one of its options")
            && warning.contains("ignored"), warning);
    }

    @Test
    void inRangeOverrideRescuesAnOutOfRangeOwnDefault() {
        VerifierSetting bounded = BOUNDED.withDefault(JsonNode.createStringNode("500"));

        VerifierCatalog catalog = policed(Map.of("bounded", Map.of("default", "75")), bounded);

        Assertions.assertNull(catalog.message(), "Not locked off: the Registry override stands in for the flawed default");
        Assertions.assertEquals(JsonNode.createStringNode("75"), defaultOf(catalog, "bounded"));
        String warning = warningAbout("mock");
        Assertions.assertTrue(warning.contains("'bounded'") && warning.contains("above its maximum 100")
            && warning.contains("override"), warning);
    }

    @Test
    void overrideCannotRescueABrokenStep() {
        VerifierSetting bounded = new VerifierSetting("bounded", "text", "number", "Bounded", null,
            true, JsonNode.createStringNode("50"), BigDecimal.ZERO, null, null);

        VerifierCatalog catalog = policed(Map.of("bounded", Map.of("default", "75")), bounded);

        Assertions.assertEquals("1 verifier unavailable: mock (invalid description)", catalog.message());
        assertLockedOff(entry(catalog, "mock"));
        Assertions.assertTrue(warningAbout("mock").contains("step 0"), warningAbout("mock"));
    }

    @Test
    void lockedOffEntryHonoursALabelOverrideButNotEnabledOrToggleable() {
        FakeVerifierClient client = new FakeVerifierClient().failing("dead", UNREACHABLE);
        VerifierRegistryEntry policy = policyEntry("dead", "Custom label", true, true, Map.of());

        VerifierCatalog catalog = build(registryOf(policy), client, retries(0));

        Verifier verifier = entry(catalog, "dead");
        Assertions.assertEquals("Custom label", verifier.label(), "Policy label wins over the fallback, even locked off");
        Assertions.assertFalse(verifier.enabled(), "Policy must not re-enable a locked-off entry");
        Assertions.assertEquals(Boolean.FALSE, verifier.toggleable(), "Policy must not re-enable a locked-off entry");
        Assertions.assertEquals(List.of(), verifier.settings());
    }

    @Test
    void lockedOffEntryWithoutALabelPolicyKeepsTheFallbackLabel() {
        FakeVerifierClient client = new FakeVerifierClient().failing("dead", UNREACHABLE);
        VerifierRegistryEntry policy = policyEntry("dead", null, null, null, Map.of());

        VerifierCatalog catalog = build(registryOf(policy), client, retries(0));

        Assertions.assertEquals("dead (offline)", entry(catalog, "dead").label());
    }

    @Test
    void lockedOffEntryReportsItsUncheckedPolicySettings() {
        FakeVerifierClient client = new FakeVerifierClient().failing("dead", UNREACHABLE);
        VerifierRegistryEntry policy = policyEntry("dead", null, null, null,
            Map.of("threshold", Map.of("default", "1")));

        VerifierCatalog catalog = build(registryOf(policy), client, retries(0));

        Assertions.assertEquals("1 verifier unavailable: dead (unreachable)", catalog.message(),
            "The unchecked policy is a log warning only, not part of the Catalog message");
        List<String> aboutDead = warnings().stream().filter(message -> message.contains("'dead'")).toList();
        Assertions.assertEquals(2, aboutDead.size(), "Lock-off warning plus one for the unchecked policy: " + aboutDead);
        Assertions.assertTrue(aboutDead.get(1).contains("threshold") && aboutDead.get(1).contains("not verified"),
            "A policy setting id cannot be checked against a locked-off Verifier: " + aboutDead.get(1));
    }

    @Test
    void lockedOffEntryWithoutASettingsPolicyWarnsOnlyAboutTheLockOff() {
        FakeVerifierClient client = new FakeVerifierClient().failing("dead", UNREACHABLE);
        VerifierRegistryEntry policy = policyEntry("dead", "Custom label", null, null, Map.of());

        build(registryOf(policy), client, retries(0));

        List<String> aboutDead = warnings().stream().filter(message -> message.contains("'dead'")).toList();
        Assertions.assertEquals(1, aboutDead.size(), "Nothing to report beyond the lock-off itself: " + aboutDead);
        Assertions.assertFalse(aboutDead.get(0).contains("not verified"), aboutDead.get(0));
    }
}
