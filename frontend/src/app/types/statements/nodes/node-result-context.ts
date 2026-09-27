import { ILatticeLevel } from "../../ifbc/lattice";

type ResultContext = {
    postVariableState: { [variable: string]: ILatticeLevel };
    context: ILatticeLevel;
    compatibleWithPostState?: boolean;
}
export class NodeResultContext {
    confidentiality?: ResultContext;
    integrity?: ResultContext;
}