import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import uplaodConfig from '../config/upload';
import Transaction from '../models/Transaction';

interface Request {
  transactionsFilename: string;
}

class ImportTransactionsService {
  async execute({ transactionsFilename }: Request): Promise<Transaction[]> {
    console.log('here');
    const csvFilePath = path.resolve(
      uplaodConfig.directory,
      transactionsFilename,
    );

    const transactionsReadStream = fs.createReadStream(csvFilePath);

    const parsers = csvParse({
      from_line: 2,
    });

    const parseCsv = transactionsReadStream.pipe(parsers);

    const categories = [];
    const transactions = [];

    parseCsv.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value || !category) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCsv.on('end', resolve));

    return transactions;
  }
}

export default ImportTransactionsService;
