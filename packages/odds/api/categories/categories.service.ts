import { Service, Application } from "@cmmv/core";
import { Repository } from "@cmmv/repository";
//@ts-ignore
import { MediasService } from "@cmmv/blog";

@Service()
export class OddsCategoriesServiceTools {
    /**
     * Update the logo of a category
     * @param categoryId - The ID of the category
     * @param image - The logo of the category as a base64 string
     * @returns The updated category
     */
    async updateCategoryImage(categoryId: string, image: string) {
        const OddsCategoriesEntity = Repository.getEntity("OddsCategoriesEntity");

        const category = await Repository.findOne(OddsCategoriesEntity, {
            id: categoryId
        });

        if (!category)
            throw new Error("Campaign not found");

        const mediasService: any = Application.resolveProvider(MediasService);
        const imageUrl = await mediasService.getImageUrl(image);

        const affectedRows = await Repository.update(OddsCategoriesEntity, categoryId, {
            image: imageUrl
        });

        return { affected: affectedRows};
    }
}
