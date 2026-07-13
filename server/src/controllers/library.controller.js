import Book from '../models/Book.model.js';
import BookIssue from '../models/BookIssue.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import ApiFeatures from '../utils/apiFeatures.js';
import crudFactory from '../utils/crudFactory.js';

const bookBase = crudFactory(Book, { resourceName: 'Book', searchFields: ['title', 'author', 'isbn'] });

export const createBook = asyncHandler(async (req, res) => {
  req.body.availableCopies = req.body.totalCopies;
  return bookBase.createOne(req, res);
});
export const listBooks = bookBase.getAll;
export const getBook = bookBase.getOne;
export const updateBook = bookBase.updateOne;
export const deleteBook = bookBase.deleteOne;

const DEFAULT_LOAN_DAYS = 14;

export const issueBook = asyncHandler(async (req, res) => {
  const { bookId, borrowerType, borrowerId, dueDate } = req.body;

  const book = await Book.findOne({ _id: bookId, school: req.schoolId });
  if (!book) throw ApiError.notFound('Book not found');
  if (book.availableCopies < 1) throw ApiError.badRequest('No copies currently available');

  const issue = await BookIssue.create({
    school: req.schoolId,
    book: book._id,
    borrowerType,
    borrower: borrowerId,
    dueDate: dueDate || new Date(Date.now() + DEFAULT_LOAN_DAYS * 24 * 60 * 60 * 1000),
    issuedBy: req.user._id,
  });

  book.availableCopies -= 1;
  await book.save();

  sendSuccess(res, { statusCode: 201, message: 'Book issued', data: issue });
});

export const returnBook = asyncHandler(async (req, res) => {
  const issue = await BookIssue.findOne({ _id: req.params.id, school: req.schoolId });
  if (!issue) throw ApiError.notFound('Issue record not found');
  if (issue.status === 'returned') throw ApiError.badRequest('This book has already been returned');

  issue.status = 'returned';
  issue.returnDate = new Date();

  if (issue.returnDate > issue.dueDate) {
    const daysLate = Math.ceil((issue.returnDate - issue.dueDate) / (24 * 60 * 60 * 1000));
    issue.fineAmount = daysLate * 0.5;
  }

  await issue.save();
  await Book.findByIdAndUpdate(issue.book, { $inc: { availableCopies: 1 } });

  sendSuccess(res, { message: 'Book returned', data: issue });
});

export const listIssues = asyncHandler(async (req, res) => {
  const filter = { school: req.schoolId };
  const { data, meta } = await new ApiFeatures(
    BookIssue.find(filter).populate('book', 'title isbn').populate('borrower', 'firstName lastName'),
    req.query,
    []
  )
    .filter()
    .sort()
    .paginate()
    .exec();
  sendSuccess(res, { data, meta });
});
