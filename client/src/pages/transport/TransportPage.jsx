import { useState } from 'react';
import clsx from 'clsx';
import SimpleResourceManager from '../../components/SimpleResourceManager.jsx';
import { useListVehiclesQuery, useCreateVehicleMutation, useUpdateVehicleMutation, useDeleteVehicleMutation } from '../../api/transportApi.js';
import { useListRoutesQuery, useCreateRouteMutation, useUpdateRouteMutation, useDeleteRouteMutation } from '../../api/transportApi.js';

const TABS = ['Routes', 'Vehicles'];

export default function TransportPage() {
  const [tab, setTab] = useState(TABS[0]);
  const { data: vehiclesData } = useListVehiclesQuery({ limit: 100 });
  const vehicleOptions = (vehiclesData?.data || []).map((v) => ({ value: v._id, label: v.vehicleNumber }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Transport</h1>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'border-b-2 px-4 py-2 text-sm font-medium',
              tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Routes' && (
        <SimpleResourceManager
          title="Route"
          fields={[
            { name: 'name', label: 'Route Name', required: true },
            { name: 'driverName', label: 'Driver Name' },
            { name: 'driverPhone', label: 'Driver Phone' },
            { name: 'vehicle', label: 'Vehicle', type: 'select', options: vehicleOptions },
          ]}
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'driverName', header: 'Driver', render: (r) => r.driverName || '-' },
            { key: 'driverPhone', header: 'Phone', render: (r) => r.driverPhone || '-' },
            { key: 'vehicle', header: 'Vehicle', render: (r) => r.vehicle?.vehicleNumber || '-' },
          ]}
          useList={useListRoutesQuery}
          useCreate={useCreateRouteMutation}
          useUpdate={useUpdateRouteMutation}
          useDelete={useDeleteRouteMutation}
        />
      )}

      {tab === 'Vehicles' && (
        <SimpleResourceManager
          title="Vehicle"
          fields={[
            { name: 'vehicleNumber', label: 'Vehicle Number', required: true },
            { name: 'model', label: 'Model' },
            { name: 'capacity', label: 'Capacity', type: 'number', required: true },
          ]}
          useList={useListVehiclesQuery}
          useCreate={useCreateVehicleMutation}
          useUpdate={useUpdateVehicleMutation}
          useDelete={useDeleteVehicleMutation}
        />
      )}
    </div>
  );
}
