import type { DatabaseSync } from 'node:sqlite';

import { agentDatabaseSchemaStatements } from './schema.sql';

type SqliteModule = typeof import('node:sqlite');

export type AgentDatabase = {
    close: () => void;
    database: DatabaseSync;
};

const loadSqliteModule = (): SqliteModule =>
    process.getBuiltinModule('node:sqlite') as SqliteModule;

export const createAgentDatabase = ({
    filename
}: {
    filename: string;
}): AgentDatabase => {
    const { DatabaseSync } = loadSqliteModule();
    const database = new DatabaseSync(filename);
    database.exec('pragma foreign_keys = on');

    for (const statement of agentDatabaseSchemaStatements) {
        database.exec(statement);
    }

    return {
        close: () => {
            database.close();
        },
        database
    };
};
