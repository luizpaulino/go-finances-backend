import { getCustomRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';
import ValidateCategory from './ValidateCategoryService';
import TransactionRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('Invalid transaction type', 400);
    }

    const transactionRepository = getCustomRepository(TransactionRepository);

    const balance = await transactionRepository.getBalance();

    if (type === 'outcome' && balance.total - value < 0) {
      throw new AppError('Withdrawal amount not allowed');
    }

    const validateCategory = new ValidateCategory();
    const categoryValid = await validateCategory.execute({ title: category });

    const transaction = await transactionRepository.create({
      title,
      value,
      type,
      category_id: categoryValid.id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
