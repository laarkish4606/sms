const RESERVED_PARAMS = ['page', 'limit', 'sort', 'search', 'fields'];

/**
 * Wraps a Mongoose Query to apply pagination, sorting, field selection,
 * simple equality filters, and a $regex search across `searchFields`.
 */
export class ApiFeatures {
  constructor(query, queryString, searchFields = []) {
    this.query = query;
    this.queryString = queryString;
    this.searchFields = searchFields;
    this.totalQuery = query.model.find(query.getFilter());
  }

  filter() {
    const filters = { ...this.queryString };
    RESERVED_PARAMS.forEach((key) => delete filters[key]);

    const parsed = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === '') return;
      parsed[key] = value;
    });

    this.query = this.query.find(parsed);
    this.totalQuery = this.totalQuery.find(parsed);
    return this;
  }

  search() {
    const { search } = this.queryString;
    if (search && this.searchFields.length) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const or = this.searchFields.map((field) => ({ [field]: regex }));
      this.query = this.query.find({ $or: or });
      this.totalQuery = this.totalQuery.find({ $or: or });
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    }
    return this;
  }

  paginate() {
    const page = Math.max(Number(this.queryString.page) || 1, 1);
    const limit = Math.min(Math.max(Number(this.queryString.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    this.pagination = { page, limit };
    return this;
  }

  async exec() {
    const [data, total] = await Promise.all([this.query, this.totalQuery.countDocuments()]);
    const { page, limit } = this.pagination || { page: 1, limit: data.length };
    return {
      data,
      meta: {
        page,
        limit,
        total,
        pages: Math.max(Math.ceil(total / limit), 1),
      },
    };
  }
}

export default ApiFeatures;
