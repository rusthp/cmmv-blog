import { getAuth } from "firebase-admin/auth";
import * as admin from "firebase-admin";

import {
    Service, Config,
    Application
} from '@cmmv/core';

import {
    Repository
} from "@cmmv/repository";

import {
    AuthAutorizationService
} from "@cmmv/auth";

interface FirebaseLoginResult {
    token: string;
    provider: string;
    user: FirebaseProviderProfile;
}

interface FirebaseProviderProfile {
    accessToken?: string;
    displayName?: string;
    email?: string;
    photoURL?: string;
    providerId?: string;
    uid?: string;
    providerData?: any[];
}

@Service("accounts")
export class AccountsService {
    /**
     * Login with Firebase
     * @param payload
     * @returns
     */
    async firebaseLogin(payload: FirebaseLoginResult, req: any, res: any){
        const UserEntity = Repository.getEntity("UserEntity");
        const { token } = payload;

        if (!admin.apps.length) {
            const firebaseProjectId = Config.get('blog.firebaseProjectId', "");
            const firebaseClientEmail = Config.get('blog.firebaseClientEmail', "");
            const firebasePrivateKey = Config.get('blog.firebasePrivateKey', "");

            if (!firebaseProjectId || !firebaseClientEmail || !firebasePrivateKey)
                throw new Error("Firebase config not set");

            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: firebaseProjectId,
                    clientEmail: firebaseClientEmail,
                    privateKey: firebasePrivateKey.replace(/\\n/g, '\n'),
                }),
            });
        }

        const decodedToken: any = await getAuth().verifyIdToken(token);

        if(decodedToken){
            const email = decodedToken.email || payload.user?.email || payload.user?.providerData?.[0]?.email;

            if(email != null && email !== "" && email.indexOf("@") > -1){
                let account = await Repository.findOne(UserEntity, {
                    email: email,
                    validated: true,
                    blocked: false
                });

                const authAutorizationService = Application.resolveProvider(AuthAutorizationService);
                const result = await authAutorizationService.autorizeUser(account, req, res, null);

                if(result)
                    return result.token;
            }
        }

        return { success: false, message: "Invalid token", decodedToken };
    }
}