import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { VerificationService, formatVerifierDuration } from './verification.service';
import { ConsoleLogGroup, ConsoleInfoLine } from '../../console/log';
import { FUNCTIONAL_VERIFIER_ID, Verifier } from '../../../types/Verifier';
import { TreeService } from '../tree.service';
import { ProjectService } from '../../project/project.service';
import { VerifierService } from '../../verifier/verifier.service';
import { ConsoleService } from '../../console/console.service';
import { IAbstractStatement, IVerifiers, nodeStateFor } from '../../../types/statements/abstract-statement';
import { LocalCBCFormula } from '../../../types/CBCFormula';
import { environment } from '../../../../environments/environment';
import { Condition } from '../../../types/condition/condition';
import { Statement } from '../../../types/statements/simple-statement';
import { CompositionStatement } from '../../../types/statements/composition-statement';
import { RootStatement } from '../../../types/statements/root-statement';
import { AbstractStatementNode } from '../../../types/statements/nodes/abstract-statement-node';

describe('VerificationService', () => {
  let service: VerificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VerificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('verifyInfo', () => {
    it('starts loading when the verification log begins', () => {
      const consoleService = TestBed.inject(ConsoleService);
      service.beginVerificationLog();
      expect(consoleService.loading()).toBeTrue();
      expect(consoleService.loadingMessage()).toBe('verifying');
    });

    it('attributes a log message to the Verifier that produced it', () => {
      const group = new ConsoleLogGroup();
      service.verifyInfo(group, {
        type: 'log',
        verifier: 'mock',
        message: 'Checking statement 1',
      });
      const line = group.lines[0] as ConsoleInfoLine;
      expect(line.message).toContain('mock');
      expect(line.message).toContain('Checking statement 1');
    });

    it('prints an orchestration log line without a [name] prefix when verifier is absent', () => {
      const group = new ConsoleLogGroup();
      service.verifyInfo(group, {
        type: 'log',
        message: 'calling mock',
      });
      const line = group.lines[0] as ConsoleInfoLine;
      expect(line.message).toBe('calling mock');
      expect(line.message).not.toContain('[');
    });

    it('surfaces a per-Verifier done signal, pass or fail, with its duration, before the final complete', () => {
      const group = new ConsoleLogGroup();
      service.verifyInfo(group, { type: 'done', verifier: 'mock', proven: false, durationMs: 4200 });
      const line = group.lines[0] as ConsoleInfoLine;
      expect(line.message).toContain('mock');
      expect(line.message.toLowerCase()).toContain('fail');
      expect(line.message).toContain('4.2 s');
    });

    it('does not add a console line for the terminal complete signal itself', () => {
      const group = new ConsoleLogGroup();
      service.verifyInfo(group, { type: 'complete', durationMs: 4200 });
      expect(group.lines.length).toBe(0);
    });
  });

  describe('formatVerifierDuration', () => {
    it('under a second: whole milliseconds', () => {
      expect(formatVerifierDuration(999)).toBe('999 ms');
    });

    it('at one second: one decimal of seconds', () => {
      expect(formatVerifierDuration(1000)).toBe('1.0 s');
    });

    it('just under a minute: one decimal of seconds', () => {
      expect(formatVerifierDuration(59900)).toBe('59.9 s');
    });

    it('at one minute: whole minutes and seconds', () => {
      expect(formatVerifierDuration(60000)).toBe('1 m 0 s');
    });

    it('formats the ticket examples', () => {
      expect(formatVerifierDuration(850)).toBe('850 ms');
      expect(formatVerifierDuration(4200)).toBe('4.2 s');
      expect(formatVerifierDuration(72000)).toBe('1 m 12 s');
    });
  });

  describe('next() per-Verifier result propagation', () => {
    let treeServiceSpy: jasmine.SpyObj<TreeService>;
    let projectServiceSpy: jasmine.SpyObj<ProjectService>;

    beforeEach(() => {
      treeServiceSpy = jasmine.createSpyObj('TreeService', [
        'getStatementsFromFormula',
        'reapplyRunChanges',
        'deriveNodeState',
      ]);
      // No settings stamps in play here: the plain derivation over the one enabled Verifier.
      treeServiceSpy.deriveNodeState.and.callFake((verifiers) => nodeStateFor(verifiers, ['mock']));
      projectServiceSpy = jasmine.createSpyObj('ProjectService', [
        'getFileContent',
        'syncLocalFileContent',
      ]);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          { provide: TreeService, useValue: treeServiceSpy },
          { provide: ProjectService, useValue: projectServiceSpy },
        ],
      });
      service = TestBed.inject(VerificationService);
    });

    it("copies each statement's verifiers map onto the live tree, not only isProven", async () => {
      const currentStatement = {
        id: '1',
        isProven: false,
        nodeState: 'unverified',
        verifiers: {},
      } as unknown as IAbstractStatement;
      const resultStatement = {
        id: '1',
        isProven: true,
        verifiers: { mock: { proven: true, status: 'ok' } },
      } as unknown as IAbstractStatement;

      const currentFormula = {
        statement: { type: 'STATEMENT' },
      } as unknown as LocalCBCFormula;
      projectServiceSpy.getFileContent.and.resolveTo(currentFormula);
      treeServiceSpy.getStatementsFromFormula.and.returnValues(
        [currentStatement],
        [resultStatement],
      );

      const group = new ConsoleLogGroup();
      const formula = {
        statement: { type: 'STATEMENT' },
        isProven: true,
        name: 'f',
      } as unknown as LocalCBCFormula;

      await service.next(group, formula, 'urn');

      expect(currentStatement.verifiers).toEqual({
        mock: { proven: true, status: 'ok' },
      });
    });

    it('sets failed-non-functional when a non-functional Verifier, not func, is what failed', async () => {
      const currentStatement = {
        id: '1',
        isProven: false,
        nodeState: 'unverified',
        verifiers: {},
      } as unknown as IAbstractStatement;
      const resultStatement = {
        id: '1',
        isProven: false,
        verifiers: { [FUNCTIONAL_VERIFIER_ID]: { proven: true }, mock: { proven: false } },
      } as unknown as IAbstractStatement;

      const currentFormula = {
        statement: { type: 'STATEMENT' },
      } as unknown as LocalCBCFormula;
      projectServiceSpy.getFileContent.and.resolveTo(currentFormula);
      treeServiceSpy.getStatementsFromFormula.and.returnValues(
        [currentStatement],
        [resultStatement],
      );

      const group = new ConsoleLogGroup();
      const formula = {
        statement: { type: 'STATEMENT' },
        isProven: false,
        name: 'f',
      } as unknown as LocalCBCFormula;

      await service.next(group, formula, 'urn');

      expect(currentStatement.nodeState).toBe('failed-non-functional');
    });

    it('after a failed all-run then a passing functional-only run, the root and every statement are verified-functional with no repair block', async () => {
      const rootStatement = {
        id: 'root',
        isProven: false,
        nodeState: 'failed-non-functional',
        verifiers: {},
      } as unknown as IAbstractStatement;
      const childStatement = {
        id: 'child',
        isProven: false,
        nodeState: 'failed-non-functional',
        verifiers: {},
      } as unknown as IAbstractStatement;

      // Functional-only run: every non-functional entry is `disabled`, func passed everywhere.
      const resultRoot = {
        id: 'root',
        isProven: true,
        verifiers: { [FUNCTIONAL_VERIFIER_ID]: { proven: true }, mock: { proven: false, disabled: true } },
      } as unknown as IAbstractStatement;
      const resultChild = {
        id: 'child',
        isProven: true,
        verifiers: { [FUNCTIONAL_VERIFIER_ID]: { proven: true }, mock: { proven: false, disabled: true } },
      } as unknown as IAbstractStatement;

      const currentFormula = { statement: { type: 'ROOT' } } as unknown as LocalCBCFormula;
      projectServiceSpy.getFileContent.and.resolveTo(currentFormula);
      treeServiceSpy.getStatementsFromFormula.and.returnValues(
        [rootStatement, childStatement],
        [resultRoot, resultChild],
      );

      const group = new ConsoleLogGroup();
      const formula = {
        statement: { type: 'ROOT' },
        isProven: true,
        name: 'f',
      } as unknown as LocalCBCFormula;

      await service.next(group, formula, 'urn');

      expect(rootStatement.isProven).toBe(true);
      expect(rootStatement.nodeState).toBe('settings-changed');
      expect(childStatement.isProven).toBe(true);
      expect(childStatement.nodeState).toBe('settings-changed');
    });

    it('reapplies mid-run changes via TreeService.reapplyRunChanges once the result lands', async () => {
      const currentStatement = {
        id: '1',
        isProven: false,
        nodeState: 'unverified',
        verifiers: {},
      } as unknown as IAbstractStatement;
      const resultStatement = {
        id: '1',
        isProven: true,
        verifiers: { [FUNCTIONAL_VERIFIER_ID]: { proven: true }, mock: { proven: true } },
      } as unknown as IAbstractStatement;

      const currentFormula = { statement: { type: 'STATEMENT' } } as unknown as LocalCBCFormula;
      projectServiceSpy.getFileContent.and.resolveTo(currentFormula);
      treeServiceSpy.getStatementsFromFormula.and.returnValues(
        [currentStatement],
        [resultStatement],
      );

      const group = new ConsoleLogGroup();
      const formula = {
        statement: { type: 'STATEMENT' },
        isProven: true,
        name: 'f',
      } as unknown as LocalCBCFormula;

      await service.next(group, formula, 'urn');

      expect(treeServiceSpy.reapplyRunChanges).toHaveBeenCalledWith([currentStatement]);
    });

    it('a statement edited during the run stays unverified after the result lands', async () => {
      treeServiceSpy.reapplyRunChanges.and.callFake((statements: IAbstractStatement[]) => {
        for (const statement of statements) {
          if (statement.id === '1') {
            statement.isProven = false;
            statement.nodeState = 'unverified';
          }
        }
      });

      const currentStatement = {
        id: '1',
        isProven: false,
        nodeState: 'unverified',
        verifiers: {},
      } as unknown as IAbstractStatement;
      const resultStatement = {
        id: '1',
        isProven: true,
        verifiers: { [FUNCTIONAL_VERIFIER_ID]: { proven: true } },
      } as unknown as IAbstractStatement;

      const currentFormula = { statement: { type: 'STATEMENT' } } as unknown as LocalCBCFormula;
      projectServiceSpy.getFileContent.and.resolveTo(currentFormula);
      treeServiceSpy.getStatementsFromFormula.and.returnValues(
        [currentStatement],
        [resultStatement],
      );

      const group = new ConsoleLogGroup();
      const formula = {
        statement: { type: 'STATEMENT' },
        isProven: true,
        name: 'f',
      } as unknown as LocalCBCFormula;

      await service.next(group, formula, 'urn');

      expect(currentStatement.nodeState).toBe('unverified');
      expect(currentStatement.isProven).toBe(false);
    });

  });

  describe('settings stamp on a landing result (real TreeService)', () => {
    const catalogUrl = environment.apiUrl + '/editor/verifiers';
    const functionalVerifier: Verifier = {
      id: 'func', label: 'Functional correctness', enabled: true, toggleable: false, settings: [], variables: [],
    };
    const mockVerifier: Verifier = {
      id: 'mock', label: 'Mock', enabled: true, toggleable: true,
      settings: [{ id: 'threshold', label: 'Threshold', type: 'text' }],
      variables: [],
    };
    const c = () => new Condition('true');

    let treeService: TreeService;
    let verifierService: VerifierService;
    let now: jasmine.Spy<() => number>;

    /** root -> comp -> (first, second), every entry a proven result carrying `stamp`. */
    function tree(stamp?: number) {
      const entries = (): IVerifiers => ({
        func: { proven: true },
        mock: stamp === undefined ? { proven: true } : { proven: true, settingsUpdatedAt: stamp },
      });
      const first = new Statement('first', c(), c(), 'x = 1;');
      first.verifiers = entries();
      const second = new Statement('second', c(), c(), 'x = 2;');
      second.verifiers = entries();
      const comp = new CompositionStatement('comp', c(), c(), new Condition('mid'), first, second);
      comp.verifiers = entries();
      const root = new RootStatement('root', c(), c(), comp);
      root.verifiers = entries();
      return { root, comp, first, second };
    }

    function load() {
      const loaded = tree();
      treeService.setFormula(new LocalCBCFormula('f', loaded.root), 'urn');
      return loaded;
    }

    function changeSettingAt(stamp: number) {
      now.and.returnValue(stamp);
      verifierService.updateSetting('mock', 'threshold', String(stamp));
      // Statement ids are derived from Date.now() too.
      now.and.callThrough();
    }

    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          {
            provide: ProjectService,
            useValue: {
              getVerifierOverrides: () => null,
              saveVerifierOverrides: () => undefined,
              verifierOverridesLoaded: new Subject<void>(),
              getFileContent: () => Promise.resolve(treeService.rootFormula),
              syncLocalFileContent: () => undefined,
            },
          },
        ],
      });
      verifierService = TestBed.inject(VerifierService);
      TestBed.inject(HttpTestingController).expectOne(catalogUrl).flush({ verifiers: [functionalVerifier, mockVerifier] });
      treeService = TestBed.inject(TreeService);
      service = TestBed.inject(VerificationService);
      now = spyOn(Date, 'now').and.callThrough();
    });

    it('a subtree verify refreshes only the subtree: the Root, the ancestors and statements outside stay stale', async () => {
      const { root, comp, first, second } = load();
      changeSettingAt(7);

      const result = tree(7).second;
      await service.nextStatement(
        new ConsoleLogGroup(),
        new LocalCBCFormula('second', new RootStatement('second', c(), c(), result)),
        treeService.findStatementNodeById(second.id)!,
        'urn',
      );

      expect(treeService.verifierResult(second, 'mock')).toBe('proven');
      expect(second.nodeState).toBe('verified-all');
      for (const outside of [root, comp, first]) {
        expect(treeService.verifierResult(outside, 'mock')).withContext(outside.name).toBe('stale');
        expect(outside.nodeState).withContext(outside.name).toBe('settings-changed');
      }
    });

    it('a whole-tree verify makes the whole diagram fresh', async () => {
      const { root, comp, first, second } = load();
      changeSettingAt(7);

      await service.next(new ConsoleLogGroup(), new LocalCBCFormula('f', tree(7).root), 'urn');

      for (const statement of [root, comp, first, second]) {
        expect(treeService.verifierResult(statement, 'mock')).withContext(statement.name).toBe('proven');
        expect(statement.nodeState).withContext(statement.name).toBe('verified-all');
      }
    });

    it('a result stamped with the settings the run started under shows stale after a mid-run change', async () => {
      const { root, second } = load();
      changeSettingAt(7);
      changeSettingAt(8);

      await service.next(new ConsoleLogGroup(), new LocalCBCFormula('f', tree(7).root), 'urn');

      expect(treeService.verifierResult(root, 'mock')).toBe('stale');
      expect(treeService.verifierResult(second, 'mock')).toBe('stale');
      expect(second.nodeState).toBe('settings-changed');
    });
  });

  describe('the run overview pushed by next()/nextStatement()', () => {
    let treeServiceSpy: jasmine.SpyObj<TreeService>;
    let projectServiceSpy: jasmine.SpyObj<ProjectService>;

    function formulaWithVerifiers(verifiers: IVerifiers, isProven: boolean): LocalCBCFormula {
      return {
        statement: { type: 'ROOT', verifiers },
        isProven,
        name: 'f',
      } as unknown as LocalCBCFormula;
    }

    function messagesOf(group: ConsoleLogGroup): string[] {
      return group.lines.map((line) => (line as ConsoleInfoLine).message);
    }

    beforeEach(() => {
      treeServiceSpy = jasmine.createSpyObj('TreeService', [
        'getStatementsFromFormula',
        'reapplyRunChanges',
        'deriveNodeState',
        'collectSubtreeNodes',
        'refreshNodes',
      ]);
      treeServiceSpy.getStatementsFromFormula.and.returnValue([]);
      treeServiceSpy.collectSubtreeNodes.and.returnValue([]);
      projectServiceSpy = jasmine.createSpyObj('ProjectService', ['getFileContent', 'syncLocalFileContent']);
      projectServiceSpy.getFileContent.and.resolveTo({ statement: { type: 'STATEMENT' } } as unknown as LocalCBCFormula);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          { provide: TreeService, useValue: treeServiceSpy },
          { provide: ProjectService, useValue: projectServiceSpy },
        ],
      });
      service = TestBed.inject(VerificationService);
    });

    it('all passed (3/3): success header and only the success count line', async () => {
      const group = service.beginVerificationLog();
      service.verifyInfo(group, { type: 'done', verifier: 'func', proven: true, durationMs: 10 });
      service.verifyInfo(group, { type: 'done', verifier: 'a', proven: true, durationMs: 10 });
      service.verifyInfo(group, { type: 'done', verifier: 'b', proven: true, durationMs: 10 });

      const formula = formulaWithVerifiers(
        { func: { proven: true }, a: { proven: true }, b: { proven: true } },
        true,
      );
      await service.next(group, formula, 'urn');

      const messages = messagesOf(group);
      expect(group.status).toBe('SUCCESS');
      expect(messages).toContain('3/3 verifiers successful');
      expect(messages.some((m) => m.includes('failed'))).toBeFalse();
      expect(messages.some((m) => m.includes('did not run'))).toBeFalse();
    });

    it('one failed (2/3): failure header, one failed line, no did-not-run line', async () => {
      const group = service.beginVerificationLog();
      service.verifyInfo(group, { type: 'done', verifier: 'func', proven: true, durationMs: 10 });
      service.verifyInfo(group, { type: 'done', verifier: 'a', proven: true, durationMs: 10 });
      service.verifyInfo(group, { type: 'done', verifier: 'b', proven: false, durationMs: 10 });

      const formula = formulaWithVerifiers(
        { func: { proven: true }, a: { proven: true }, b: { proven: false } },
        false,
      );
      await service.next(group, formula, 'urn');

      const messages = messagesOf(group);
      expect(group.status).toBe('FAIL');
      expect(messages).toContain('1 verifier failed');
      expect(messages.some((m) => m.includes('did not run'))).toBeFalse();
    });

    it('Catalog func/mock/dead, mock and dead disabled, func passed: 1/3, 2 did not run, verified line even though x < y', async () => {
      const group = service.beginVerificationLog();
      service.verifyInfo(group, { type: 'done', verifier: FUNCTIONAL_VERIFIER_ID, proven: true, durationMs: 10 });

      const formula = formulaWithVerifiers(
        {
          [FUNCTIONAL_VERIFIER_ID]: { proven: true },
          mock: { proven: false, disabled: true },
          dead: { proven: false, disabled: true },
        },
        true,
      );
      await service.next(group, formula, 'urn');

      const messages = messagesOf(group);
      expect(group.status).toBe('SUCCESS');
      expect(messages.some((m) => m.includes('is verified'))).toBeTrue();
      expect(messages).toContain('1/3 verifiers successful');
      expect(messages).toContain('2 verifiers did not run');
      expect(messages.some((m) => m.includes('failed'))).toBeFalse();
    });

    it('Catalog func/mock/dead, all three enabled and passed: 3/3, no did-not-run line', async () => {
      const group = service.beginVerificationLog();
      service.verifyInfo(group, { type: 'done', verifier: FUNCTIONAL_VERIFIER_ID, proven: true, durationMs: 10 });
      service.verifyInfo(group, { type: 'done', verifier: 'mock', proven: true, durationMs: 10 });
      service.verifyInfo(group, { type: 'done', verifier: 'dead', proven: true, durationMs: 10 });

      const formula = formulaWithVerifiers(
        {
          [FUNCTIONAL_VERIFIER_ID]: { proven: true },
          mock: { proven: true },
          dead: { proven: true },
        },
        true,
      );
      await service.next(group, formula, 'urn');

      const messages = messagesOf(group);
      expect(group.status).toBe('SUCCESS');
      expect(messages).toContain('3/3 verifiers successful');
      expect(messages.some((m) => m.includes('did not run'))).toBeFalse();
    });

    it('mock enabled and failed, dead disabled, func passed, isProven false: 1/3, 1 failed, 1 did not run', async () => {
      const group = service.beginVerificationLog();
      service.verifyInfo(group, { type: 'done', verifier: FUNCTIONAL_VERIFIER_ID, proven: true, durationMs: 10 });
      service.verifyInfo(group, { type: 'done', verifier: 'mock', proven: false, durationMs: 10 });

      const formula = formulaWithVerifiers(
        {
          [FUNCTIONAL_VERIFIER_ID]: { proven: true },
          mock: { proven: false },
          dead: { proven: false, disabled: true },
        },
        false,
      );
      await service.next(group, formula, 'urn');

      const messages = messagesOf(group);
      expect(group.status).toBe('FAIL');
      expect(messages).toContain('1/3 verifiers successful');
      expect(messages).toContain('1 verifier failed');
      expect(messages).toContain('1 verifier did not run');
    });

    it('func failed, mock enabled (never ran), dead disabled: 0/3, 1 failed (func only), 2 did not run, functional-failure line', async () => {
      const group = service.beginVerificationLog();
      service.verifyInfo(group, { type: 'done', verifier: FUNCTIONAL_VERIFIER_ID, proven: false, durationMs: 10 });

      const formula = formulaWithVerifiers(
        {
          [FUNCTIONAL_VERIFIER_ID]: { proven: false },
          mock: { proven: false },
          dead: { proven: false, disabled: true },
        },
        false,
      );
      await service.next(group, formula, 'urn');

      const messages = messagesOf(group);
      expect(group.status).toBe('FAIL');
      expect(messages).toContain('0/3 verifiers successful');
      expect(messages).toContain('1 verifier failed');
      expect(messages).toContain('2 verifiers did not run');
      expect(messages).toContain('No other Verifiers ran because functional verification failed.');
    });

    it('functional-only (only func non-disabled, passed): 1/2 verifiers successful, 1 did not run', async () => {
      const group = service.beginVerificationLog();
      service.verifyInfo(group, { type: 'done', verifier: FUNCTIONAL_VERIFIER_ID, proven: true, durationMs: 10 });

      const formula = formulaWithVerifiers(
        {
          [FUNCTIONAL_VERIFIER_ID]: { proven: true },
          other: { proven: false, disabled: true },
        },
        true,
      );
      await service.next(group, formula, 'urn');

      const messages = messagesOf(group);
      expect(group.status).toBe('SUCCESS');
      expect(messages).toContain('1/2 verifiers successful');
      expect(messages).toContain('1 verifier did not run');
      expect(messages.some((m) => m.includes('failed'))).toBeFalse();
    });

    it('nextStatement pushes the same overview as next()', async () => {
      const group = service.beginVerificationLog();
      service.verifyInfo(group, { type: 'done', verifier: 'func', proven: true, durationMs: 10 });
      service.verifyInfo(group, { type: 'done', verifier: 'a', proven: true, durationMs: 10 });

      const formula = formulaWithVerifiers({ func: { proven: true }, a: { proven: true } }, true);
      const statementNode = {
        statement: { name: 'stmt', type: 'STATEMENT' },
        children: [],
      } as unknown as AbstractStatementNode;

      await service.nextStatement(group, formula, statementNode, 'urn');

      const messages = messagesOf(group);
      expect(group.status).toBe('SUCCESS');
      expect(messages).toContain('2/2 verifiers successful');
    });

    it('nextStatement pushes the same overview from a Catalog with a disabled entry', async () => {
      const group = service.beginVerificationLog();
      service.verifyInfo(group, { type: 'done', verifier: FUNCTIONAL_VERIFIER_ID, proven: true, durationMs: 10 });

      const formula = formulaWithVerifiers(
        {
          [FUNCTIONAL_VERIFIER_ID]: { proven: true },
          mock: { proven: false, disabled: true },
          dead: { proven: false, disabled: true },
        },
        true,
      );
      const statementNode = {
        statement: { name: 'stmt', type: 'STATEMENT' },
        children: [],
      } as unknown as AbstractStatementNode;

      await service.nextStatement(group, formula, statementNode, 'urn');

      const messages = messagesOf(group);
      expect(group.status).toBe('SUCCESS');
      expect(messages).toContain('1/3 verifiers successful');
      expect(messages).toContain('2 verifiers did not run');
    });

    it('pushes "Total time: …" as the overview\'s last line, after the counts', async () => {
      const group = service.beginVerificationLog();
      service.verifyInfo(group, { type: 'done', verifier: 'func', proven: true, durationMs: 10 });
      service.verifyInfo(group, { type: 'done', verifier: 'a', proven: true, durationMs: 10 });
      service.verifyInfo(group, { type: 'complete', durationMs: 4200 });

      const formula = formulaWithVerifiers({ func: { proven: true }, a: { proven: true } }, true);
      await service.next(group, formula, 'urn');

      const messages = messagesOf(group);
      expect(messages).toContain('2/2 verifiers successful');
      expect(messages[messages.length - 1]).toBe('Total time: 4.2 s');
    });

    it('nextStatement pushes the same "Total time: …" last line', async () => {
      const group = service.beginVerificationLog();
      service.verifyInfo(group, { type: 'done', verifier: 'func', proven: true, durationMs: 10 });
      service.verifyInfo(group, { type: 'complete', durationMs: 850 });

      const formula = formulaWithVerifiers({ func: { proven: true } }, true);
      const statementNode = {
        statement: { name: 'stmt', type: 'STATEMENT' },
        children: [],
      } as unknown as AbstractStatementNode;

      await service.nextStatement(group, formula, statementNode, 'urn');

      const messages = messagesOf(group);
      expect(messages[messages.length - 1]).toBe('Total time: 850 ms');
    });

    it('with no duration recorded for the group (next called without beginVerificationLog), pushes no total-time line', async () => {
      const group = new ConsoleLogGroup();
      const formula = formulaWithVerifiers({ func: { proven: true } }, true);

      await service.next(group, formula, 'urn');

      const messages = messagesOf(group);
      expect(messages.some((m) => m.startsWith('Total time'))).toBeFalse();
    });
  });
});
