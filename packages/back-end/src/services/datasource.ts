import { AES, enc } from "crypto-js";
import { ENCRYPTION_KEY } from "../util/secrets";
import GoogleAnalytics from "../integrations/GoogleAnalytics";
import Athena from "../integrations/Athena";
import Presto from "../integrations/Presto";
import Redshift from "../integrations/Redshift";
import Snowflake from "../integrations/Snowflake";
import Postgres from "../integrations/Postgres";
import { SourceIntegrationInterface, TestQueryRow } from "../types/Integration";
import BigQuery from "../integrations/BigQuery";
import ClickHouse from "../integrations/ClickHouse";
import Mixpanel from "../integrations/Mixpanel";
import { DataSourceInterface, DataSourceParams } from "../../types/datasource";
import Mysql from "../integrations/Mysql";
import Mssql from "../integrations/Mssql";
import { postDataSourceSchema } from "../models/DataSourceModel";

export function decryptDataSourceParams<T = DataSourceParams>(
  encrypted: string
): T {
  return JSON.parse(AES.decrypt(encrypted, ENCRYPTION_KEY).toString(enc.Utf8));
}

export function encryptParams(params: DataSourceParams): string {
  return AES.encrypt(JSON.stringify(params), ENCRYPTION_KEY).toString();
}

export function getNonSensitiveParams(integration: SourceIntegrationInterface) {
  const ret = { ...integration.params };
  integration.getSensitiveParamKeys().forEach((k) => {
    if (ret[k]) {
      ret[k] = "";
    }
  });
  return ret;
}

export function mergeParams(
  integration: SourceIntegrationInterface,
  newParams: Partial<DataSourceParams>
) {
  const secretKeys = integration.getSensitiveParamKeys();
  Object.keys(newParams).forEach((k: keyof DataSourceParams) => {
    // If a secret value is left empty, keep the original value
    if (secretKeys.includes(k) && !newParams[k]) return;
    integration.params[k] = newParams[k];
  });
}

export function getSourceIntegrationObject(datasource: DataSourceInterface) {
  const { type, params, settings } = datasource;

  let obj: SourceIntegrationInterface;
  if (type === "athena") {
    obj = new Athena(params, settings);
  } else if (type === "redshift") {
    obj = new Redshift(params, settings);
  } else if (type === "google_analytics") {
    obj = new GoogleAnalytics(params, settings);
  } else if (type === "snowflake") {
    obj = new Snowflake(params, settings);
  } else if (type === "postgres") {
    obj = new Postgres(params, settings);
  } else if (type === "mysql") {
    obj = new Mysql(params, settings);
  } else if (type === "mssql") {
    obj = new Mssql(params, settings);
  } else if (type === "bigquery") {
    obj = new BigQuery(params, settings);
  } else if (type === "clickhouse") {
    obj = new ClickHouse(params, settings);
  } else if (type === "mixpanel") {
    obj = new Mixpanel(params, settings ?? {});
  } else if (type === "presto") {
    obj = new Presto(params, settings);
  } else {
    throw new Error("Unknown data source type: " + type);
  }

  obj.organization = datasource.organization;
  obj.datasource = datasource.id;

  return obj;
}

export async function generateSchema(
  datasource: DataSourceInterface,
  orgId: string
): Promise<any> {
  const integration = getSourceIntegrationObject(datasource);

  if (!integration) {
    return;
  }

  // The Mixpanel integration does not support test queries
  if (!integration.runGetSchemaQuery) {
    throw new Error("Unable to test query.");
    //MKTODO: We'll want to change this to fail elegantly so it doesn't block creating a Mixpanel datasource
  }

  // Postgres SQL
  // const sql =
  //   "SELECT table_name, column_name, data_type, table_catalog FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name;";

  // BigQuery SQL
  // const sql =
  //   "SELECT table_name, column_name, data_type, table_catalog from adept-arbor-354914.sample_data_set.INFORMATION_SCHEMA.COLUMNS ORDER BY table_name;";

  // BigQuery SQL to get datasets
  const sql = " SELECT * from adept-arbor-354914.INFORMATION_SCHEMA.SCHEMATA;";

  try {
    console.log("got here");
    const results = await integration.runGetSchemaQuery(sql);
    console.log("results", results);

    //TODO: Update this to support table_catalog for Postgres

    const formattedResults: any = [];

    results.forEach((row: any) => {
      const key = row.table_name;

      if (
        !formattedResults.length ||
        formattedResults.findIndex((i: any) => i.table_name === key) === -1
      ) {
        formattedResults.push({ table_name: key, columns: [] });
      }

      const index = formattedResults.findIndex(
        (e: any) => e.table_name === key
      );

      formattedResults[index].columns.push({
        column_name: row.column_name,
        data_type: row.data_type,
      });
    });

    await postDataSourceSchema(datasource.id, orgId, formattedResults);

    return { results, formattedResults };
  } catch (e) {
    return {
      error: e.message,
    };
  }
}

export async function testDataSourceConnection(
  datasource: DataSourceInterface
) {
  const integration = getSourceIntegrationObject(datasource);
  await integration.testConnection();
}

export async function testQuery(
  datasource: DataSourceInterface,
  query: string
): Promise<{
  results?: TestQueryRow[];
  duration?: number;
  error?: string;
  sql?: string;
}> {
  const integration = getSourceIntegrationObject(datasource);

  // The Mixpanel integration does not support test queries
  if (!integration.getTestQuery || !integration.runTestQuery) {
    throw new Error("Unable to test query.");
  }

  const sql = integration.getTestQuery(query);
  try {
    const { results, duration } = await integration.runTestQuery(sql);
    return {
      results,
      duration,
      sql,
    };
  } catch (e) {
    return {
      error: e.message,
      sql,
    };
  }
}
