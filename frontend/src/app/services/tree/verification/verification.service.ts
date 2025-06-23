import {Injectable} from '@angular/core';
import {CBCFormula} from '../../../types/CBCFormula';
import {TreeService} from '../tree.service';

/**
 * Service to distribute the verification result from the http response to the tree service.
 * @see TreeService
 */
@Injectable({
  providedIn: 'root'
})
export class VerificationService {

  constructor(private treeService : TreeService) { }
  
  public next(formula : CBCFormula) {
    if (formula.statement) {
      //TODO: Reimplement this this.traverseStatements(formula.statement)
    }
  }
}
