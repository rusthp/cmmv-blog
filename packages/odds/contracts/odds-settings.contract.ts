import {
    Contract, AbstractContract,
    ContractField
} from "@cmmv/core";

@Contract({
    namespace: 'Odds',
    controllerName: 'OddsSettings',
    controllerCustomPath: 'odds/settings',
    protoPackage: 'odds',
    subPath: '/odds',
    generateController: true,
    generateBoilerplates: false,
    auth: true,
    options: {
        moduleContract: true,
        databaseSchemaName: "odds_settings",
        databaseTimestamps: true
    }
})
export class OddsSettingsContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    name!: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    authType!: string; // e.g., 'API Key', 'Bearer Token', 'Basic Auth'

    @ContractField({
        protoType: 'string',
        nullable: false,
    })
    baseUrl!: string;

    /**
     * API Key, Bearer Token, or other sensitive credentials.
     * Should be stored encrypted.
     */
    @ContractField({
        protoType: 'text',
        nullable: true,
    })
    apiKey!: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    username!: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
    })
    password!: string;

    /**
     * JSON string for request headers.
     * Can use placeholders like {{apiKey}}.
     */
    @ContractField({
        protoType: 'text',
        nullable: true,
    })
    headers!: string;
} 