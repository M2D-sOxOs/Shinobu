export type ModelConfig = {
  Data: string,
  Throttle: number
};

export class Model {

  public readonly Data: string;

  public readonly Throttle: number;

  constructor(modelConfig: ModelConfig) {

    this.Data = Buffer.from(modelConfig.Data, 'base64').toString('utf8');
    this.Throttle = modelConfig.Throttle;
  }

  public async Estimate(htmlCode: string): Promise<boolean> {

    return false;
  }

}
