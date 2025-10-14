// app/admin/customize/[subjectId]/components/LinkFileForm.tsx
"use client";

export default function LinkFileForm({ data, setData }: { data: any, setData: Function }) {
    return (
        <>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL</label>
                <input
                    value={data.url || ''}
                    onChange={e => setData({ ...data, url: e.target.value })}
                    placeholder="https://..."
                    required
                    className="block w-full p-2 border rounded"
                />
            </div>
        </>
    );
}