import { getRepository } from 'typeorm';

import Category from '../models/Category';

interface Request {
  title: string;
}

class ValidateCategoryService {
  public async execute({ title }: Request): Promise<Category> {
    const categoryRepository = getRepository(Category);

    console.log(title);

    const checkCategoryExists = await categoryRepository.findOne({
      where: { title },
    });

    console.log(checkCategoryExists);

    if (checkCategoryExists) {
      return checkCategoryExists;
    }

    const newCategory = categoryRepository.create({ title });
    await categoryRepository.save(newCategory);

    return newCategory;
  }
}

export default ValidateCategoryService;
