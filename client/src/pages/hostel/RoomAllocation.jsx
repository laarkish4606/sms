import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, UserPlus, X } from 'lucide-react';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import Spinner from '../../components/Spinner.jsx';
import {
  useListRoomsQuery,
  useCreateRoomMutation,
  useAllocateBedMutation,
  useVacateBedMutation,
} from '../../api/hostelApi.js';
import { useListStudentsQuery } from '../../api/studentsApi.js';

export default function RoomAllocation({ hostelOptions }) {
  const [formOpen, setFormOpen] = useState(false);
  const [values, setValues] = useState({ hostel: '', roomNumber: '', floor: '', capacity: 4, feePerTerm: 0 });
  const [allocatingRoom, setAllocatingRoom] = useState(null);
  const [studentToAllocate, setStudentToAllocate] = useState('');

  const { data, isLoading, isError } = useListRoomsQuery({ limit: 100 });
  const { data: studentsData } = useListStudentsQuery({ limit: 100 });
  const [createRoom, { isLoading: creating }] = useCreateRoomMutation();
  const [allocateBed] = useAllocateBedMutation();
  const [vacateBed] = useVacateBedMutation();

  const columns = [
    { key: 'hostel', header: 'Hostel', render: (r) => r.hostel?.name },
    { key: 'roomNumber', header: 'Room' },
    { key: 'floor', header: 'Floor', render: (r) => r.floor || '-' },
    { key: 'occupancy', header: 'Occupancy', render: (r) => `${r.beds.filter((b) => b.student).length}/${r.beds.length}` },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button className="flex items-center gap-1 text-gray-400 hover:text-primary-600" onClick={() => setAllocatingRoom(r)}>
          <UserPlus size={16} /> Manage
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setFormOpen(true)}>
          <Plus size={16} /> Add Room
        </button>
      </div>

      <DataTable columns={columns} rows={data?.data || []} isLoading={isLoading} isError={isError} />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Add Room">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await createRoom({ ...values, capacity: Number(values.capacity), feePerTerm: Number(values.feePerTerm) }).unwrap();
              toast.success('Room added');
              setFormOpen(false);
            } catch (err) {
              toast.error(err?.data?.message || 'Failed to add room');
            }
          }}
        >
          <div>
            <label className="label">Hostel</label>
            <select className="input" required value={values.hostel} onChange={(e) => setValues((v) => ({ ...v, hostel: e.target.value }))}>
              <option value="">Select...</option>
              {hostelOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Room Number</label>
              <input className="input" required value={values.roomNumber} onChange={(e) => setValues((v) => ({ ...v, roomNumber: e.target.value }))} />
            </div>
            <div>
              <label className="label">Floor</label>
              <input className="input" value={values.floor} onChange={(e) => setValues((v) => ({ ...v, floor: e.target.value }))} />
            </div>
            <div>
              <label className="label">Capacity</label>
              <input type="number" min="1" className="input" required value={values.capacity} onChange={(e) => setValues((v) => ({ ...v, capacity: e.target.value }))} />
            </div>
            <div>
              <label className="label">Fee / term</label>
              <input type="number" min="0" className="input" value={values.feePerTerm} onChange={(e) => setValues((v) => ({ ...v, feePerTerm: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? <Spinner size={16} className="text-white" /> : 'Add room'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(allocatingRoom)} onClose={() => setAllocatingRoom(null)} title={`Room ${allocatingRoom?.roomNumber}`}>
        <div className="space-y-2">
          {allocatingRoom?.beds.map((bed) => (
            <div key={bed._id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800">
              <span>
                Bed {bed.bedNumber}: {bed.student ? `${bed.student.firstName} ${bed.student.lastName}` : 'Empty'}
              </span>
              {bed.student && (
                <button
                  className="text-red-500 hover:text-red-600"
                  onClick={async () => {
                    await vacateBed({ roomId: allocatingRoom._id, bedId: bed._id }).unwrap();
                    toast.success('Bed vacated');
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <select className="input" value={studentToAllocate} onChange={(e) => setStudentToAllocate(e.target.value)}>
            <option value="">Select student...</option>
            {(studentsData?.data || []).map((s) => (
              <option key={s._id} value={s._id}>
                {s.firstName} {s.lastName}
              </option>
            ))}
          </select>
          <button
            className="btn-primary shrink-0"
            disabled={!studentToAllocate}
            onClick={async () => {
              try {
                await allocateBed({ roomId: allocatingRoom._id, studentId: studentToAllocate }).unwrap();
                toast.success('Bed allocated');
                setStudentToAllocate('');
              } catch (err) {
                toast.error(err?.data?.message || 'Failed to allocate bed');
              }
            }}
          >
            Allocate
          </button>
        </div>
      </Modal>
    </div>
  );
}
