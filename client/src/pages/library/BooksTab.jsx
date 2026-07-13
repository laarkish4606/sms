import SimpleResourceManager from '../../components/SimpleResourceManager.jsx';
import { useListBooksQuery, useCreateBookMutation, useUpdateBookMutation, useDeleteBookMutation } from '../../api/libraryApi.js';

export default function BooksTab() {
  return (
    <SimpleResourceManager
      title="Book"
      fields={[
        { name: 'title', label: 'Title', required: true },
        { name: 'author', label: 'Author' },
        { name: 'isbn', label: 'ISBN' },
        { name: 'category', label: 'Category' },
        { name: 'totalCopies', label: 'Total Copies', type: 'number', required: true, default: 1 },
        { name: 'rackNumber', label: 'Rack Number' },
      ]}
      columns={[
        { key: 'title', header: 'Title' },
        { key: 'author', header: 'Author', render: (r) => r.author || '-' },
        { key: 'category', header: 'Category', render: (r) => r.category || '-' },
        { key: 'availableCopies', header: 'Available', render: (r) => `${r.availableCopies}/${r.totalCopies}` },
      ]}
      useList={useListBooksQuery}
      useCreate={useCreateBookMutation}
      useUpdate={useUpdateBookMutation}
      useDelete={useDeleteBookMutation}
    />
  );
}
