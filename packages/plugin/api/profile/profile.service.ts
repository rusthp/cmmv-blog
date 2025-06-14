import {
    AbstractService,
    Service
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";
import { MediasService } from "../medias/medias.service";

@Service("blog_profile")
export class BlogProfileService extends AbstractService {
    constructor(private readonly mediasService: MediasService){
        super();
    }

    /**
     * Get the profile of the user
     * @param user
     * @returns
     */
    public async getProfile(user: any) {
        const UserEntity = Repository.getEntity("UserEntity");
        const userData = await Repository.findOne(UserEntity, { id: user.id, blocked: false });

        if(!userData)
            throw new Error(`User with ID ${user?.id} not found or is blocked`);

        const ProfilesEntity = Repository.getEntity("ProfilesEntity");
        const profile = await Repository.findOne(ProfilesEntity, { user: user.id }, {
            select: [
                "id", "name", "slug", "image", "coverImage", "bio",
                "website", "location", "facebook", "twitter", "instagram", "linkedin", "github",
                "locale", "visibility", "metaTitle", "metaDescription", "lastSeen",
                "commentNotifications", "mentionNotifications", "recommendationNotifications"
            ]
        });

        return {
            ...user,
            email: userData.email,
            profile: profile ? profile : {}
        };
    }

    /**
     * Update the profile of the user
     * @param profile
     * @returns
     */
    public async updateProfile(user: any, profile: any) {
        const UserEntity = Repository.getEntity("UserEntity");
        const userData = await Repository.findOne(UserEntity, { id: user.id, blocked: false });

        if(!userData)
            throw new Error(`User with ID ${user?.id} not found or is blocked`);

        if (profile.image && profile.image.startsWith('data:image')) {
            profile.image = await this.mediasService.getImageUrl(
                profile.image,
                "webp",
                400,
                400,
                80,
                `${profile.name || 'user'} profile image`
            );
        }

        if (profile.coverImage && profile.coverImage.startsWith('data:image')) {
            profile.coverImage = await this.mediasService.getImageUrl(
                profile.coverImage,
                "webp",
                1200,
                400,
                80,
                `${profile.name || 'user'} cover image`
            );
        }

        const ProfilesEntity = Repository.getEntity("ProfilesEntity");
        const profileData = await Repository.findOne(ProfilesEntity, { user: user.id });

        if(profileData){
            profileData.name = profile.name;
            profileData.slug = profile.slug;
            profileData.image = profile.image;
            profileData.coverImage = profile.coverImage;
            profileData.bio = profile.bio;
            profileData.website = profile.website;
            profileData.location = profile.location;
            profileData.facebook = profile.facebook;
            profileData.twitter = profile.twitter;
            profileData.instagram = profile.instagram;
            profileData.linkedin = profile.linkedin;
            profileData.github = profile.github;
            profileData.locale = profile.locale;
            profileData.visibility = profile.visibility;
            profileData.metaTitle = profile.metaTitle;
            profileData.metaDescription = profile.metaDescription;
            profileData.commentNotifications = profile.commentNotifications;
            profileData.mentionNotifications = profile.mentionNotifications;
            profileData.recommendationNotifications = profile.recommendationNotifications;

            await Repository.updateById(ProfilesEntity, profileData.id, profileData);
        }
        else {
            let newProfileData = new ProfilesEntity();
            newProfileData.user = user.id;
            newProfileData.name = profile.name;
            newProfileData.slug = profile.slug;
            newProfileData.image = profile.image;
            newProfileData.coverImage = profile.coverImage;
            newProfileData.bio = profile.bio;
            newProfileData.website = profile.website;
            newProfileData.location = profile.location;
            newProfileData.facebook = profile.facebook;
            newProfileData.twitter = profile.twitter;
            newProfileData.instagram = profile.instagram;
            newProfileData.linkedin = profile.linkedin;
            newProfileData.github = profile.github;
            newProfileData.locale = profile.locale;
            newProfileData.visibility = profile.visibility;
            newProfileData.metaTitle = profile.metaTitle;
            newProfileData.metaDescription = profile.metaDescription;

            await Repository.insert(ProfilesEntity, newProfileData);
        }

        return {
            success: true,
            message: "Profile updated successfully"
        }
    }
}