export interface VerificationResult {
  errors: QbCException[];
  correctnessCondition: string;
  prover: ProverMap;
}
export interface ProverMap {
  [key: string]: string;
}

export interface RequestError {
  title: string;
}

export interface QbCException {
  type: string;
  message: string;
  refinementID: number;
  title: string;
}
