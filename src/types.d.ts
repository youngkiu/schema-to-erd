export type parseDdlType = {
  [tableName: string]: {
    columnNames: string[],
    primaryKeys: string[],
  }
};

export type pumlOutputType = {
  pumlFilePath: string;
  pumlStr: string;
};
