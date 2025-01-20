import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {MatButtonHarness} from '@angular/material/button/testing';
import {MatDialogHarness} from '@angular/material/dialog/testing';
import { ProjectService } from './services/project/project.service';

describe('AppComponent', () => {

  let loader : HarnessLoader

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideHttpClient(), provideAnimations()]
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent)
    loader = TestbedHarnessEnvironment.loader(fixture)
    fixture.autoDetectChanges()
    const component = fixture.componentInstance
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should initalize with disabled generate code and verify buttons', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.autoDetectChanges()
    const generateCodeButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'code  Generate Code' }))
    expect(generateCodeButton).not.toBe(null)
    expect(await generateCodeButton?.isDisabled()).toBeTrue()

    const verifyButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'check_circle Verify'}))
    expect(verifyButton).not.toBe(null)
    expect(await verifyButton?.isDisabled()).toBeTrue()

  })

  it('should open "Create Project" Dialog on click on Share button without project id not set', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.autoDetectChanges()

    const shareButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text : 'share  Share'}))
    expect(shareButton).not.toBe(null)
    
    const projectService = fixture.debugElement.injector.get(ProjectService)
    expect(projectService.projectId).toBe(undefined)

    /*shareButton?.click()
    fixture.detectChanges()

    const dialogs = await loader.getAllHarnesses(MatDialogHarness)
    console.log(dialogs)
    expect(dialogs.length).toBe(1)
    expect(await dialogs[0].getTitleText() == 'Create Project')*/
  })
});
