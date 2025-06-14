import { Service } from "@cmmv/core";
import { Repository } from "@cmmv/repository";

@Service()
export class NewsletterSubscribersService {
    constructor() {}

    /**
     * Subscribe to newsletter
     * @param data Subscriber data
     * @returns The created subscriber
     */
    async subscribe(data: { email: string; name?: string; source?: string }) {
        const NewsletterSubscribersEntity = Repository.getEntity("NewsletterSubscribersEntity");

        const existingSubscriber = await Repository.findOne(NewsletterSubscribersEntity, {
            email: data.email.toLowerCase().trim()
        });

        if (existingSubscriber) {
            if (!existingSubscriber.active) {
                await Repository.update(NewsletterSubscribersEntity, existingSubscriber.id, {
                    active: true,
                    subscribedAt: new Date()
                });
                return { success: true, message: "Subscription reactivated" };
            }
            return { success: true, message: "Already subscribed" };
        }

        await Repository.insert(NewsletterSubscribersEntity, {
            email: data.email.toLowerCase().trim(),
            name: data.name || null,
            source: data.source || "website",
            active: true,
            subscribedAt: new Date()
        });

        return { success: true, message: "Successfully subscribed" };
    }

    /**
     * Unsubscribe from newsletter
     * @param email Email to unsubscribe
     * @returns Success status
     */
    async unsubscribe(email: string) {
        const NewsletterSubscribersEntity = Repository.getEntity("NewsletterSubscribersEntity");

        const subscriber = await Repository.findOne(NewsletterSubscribersEntity, {
            email: email.toLowerCase().trim()
        });

        if (!subscriber)
            return { success: false, message: "Email not found in our subscriber list" };

        await Repository.update(NewsletterSubscribersEntity, subscriber.id, {
            active: false
        });

        return { success: true, message: "Successfully unsubscribed" };
    }
}