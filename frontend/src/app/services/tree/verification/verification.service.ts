import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { CBCFormula } from '../../project/CBCFormula';
import { Statement } from '../../../types/statements/statement';
import { SimpleStatement } from '../../../types/statements/simple-statement';
import { SelectionStatement } from '../../../types/statements/selection-statement';
import { RepetitionStatement } from '../../../types/statements/repetition-statement';
import { CompositionStatement } from '../../../types/statements/compositon-statement';
import { StrongWeakStatement } from '../../../types/statements/strong-weak-statement';
import { TreeService } from '../tree.service';

@Injectable({
  providedIn: 'root'
})
export class VerificationService {

  constructor(private treeService : TreeService) { }

  private traverseStatements(statement : Statement) {

    switch (statement.type) {
      case SimpleStatement.TYPE: this.addSimpleStatement(statement as SimpleStatement); break
      case SelectionStatement.TYPE: this.addSelectionStatement(statement as SelectionStatement); break
      case RepetitionStatement.TYPE: this.addRepetitionStatement(statement as RepetitionStatement); break 
      case CompositionStatement.TYPE: this.addCompositionStatement(statement as CompositionStatement); break
      case StrongWeakStatement.TYPE: this.addStrongWeakStatement(statement as StrongWeakStatement); break
    }
  }

  private addSimpleStatement(statement : SimpleStatement) {
    this.treeService.verificationResultNotifier.next(statement)
    if (statement.refinement) {
      this.traverseStatements(statement.refinement)
    }
  }

  private addStrongWeakStatement(statement : StrongWeakStatement) {
    this.treeService.verificationResultNotifier.next(statement)

    if (statement.refinement) {
      this.traverseStatements(statement.refinement)
    }
  }

  private addSelectionStatement(statement : SelectionStatement) {
    this.treeService.verificationResultNotifier.next(statement)

    for (const child of statement.commands) {
      if (child) {
        this.traverseStatements(child)
      }
    }
  }
  
  private addRepetitionStatement(statement : RepetitionStatement) {
    this.treeService.verificationResultNotifier.next(statement)
    if (statement.loopStatement) {
      this.traverseStatements(statement.loopStatement)
    }
  }

  private addCompositionStatement(statement : CompositionStatement) {
    this.treeService.verificationResultNotifier.next(statement)

    if (statement.firstStatement) {
      this.traverseStatements(statement.firstStatement)
    }

    if (statement.secondStatement) {
      this.traverseStatements(statement.secondStatement)
    }
  }

 


  public next(formula : CBCFormula) {
    if (formula.statement) {
      this.traverseStatements(formula.statement)
    }
  }
}
