import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { getRepository, In } from 'typeorm';

import uplaodConfig from '../config/upload';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  transactionsFilename: string;
}

interface CsvTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ transactionsFilename }: Request): Promise<Transaction[]> {
    const csvFilePath = path.resolve(
      uplaodConfig.directory,
      transactionsFilename,
    );

    const transactionsReadStream = fs.createReadStream(csvFilePath);

    const parsers = csvParse({
      from_line: 2,
    });

    const parseCsv = transactionsReadStream.pipe(parsers);

    const categories: string[] = [];
    const transactions: CsvTransaction[] = [];
    const transactionRepository = getRepository(Transaction);
    const categoryRepository = getRepository(Category);

    parseCsv.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value || !category) return;

      categories.push(category);
      transactions.push({
        title,
        type,
        value,
        category,
      });
    });

    await new Promise(resolve => parseCsv.on('end', resolve));

    const categoriesExistents = await categoryRepository.find({
      where: { title: In(categories) },
    });

    const categoryTitlesExistents = categoriesExistents.map(
      (categoryExistent: Category) => categoryExistent.title,
    );

    const addCategories = categories
      .filter(category => !categoryTitlesExistents.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoryRepository.create(
      addCategories.map(title => ({ title })),
    );

    await categoryRepository.save(newCategories);

    const finalCategories = [...categoriesExistents, ...newCategories];

    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        value: transaction.value,
        type: transaction.type,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(createdTransactions);

    await fs.promises.unlink(csvFilePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
