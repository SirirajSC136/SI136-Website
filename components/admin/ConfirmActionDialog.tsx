"use client";

type ConfirmActionDialogProps = {
	open: boolean;
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	confirmVariant?: "danger" | "primary";
	onConfirm: () => void;
	onCancel: () => void;
};

export default function ConfirmActionDialog({
	open,
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	confirmVariant = "danger",
	onConfirm,
	onCancel,
}: ConfirmActionDialogProps) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
				<h3 className="text-lg font-semibold text-foreground">{title}</h3>
				<p className="mt-2 text-sm text-muted-foreground">{description}</p>
				<div className="mt-4 flex justify-end gap-2">
					<button
						type="button"
						onClick={onCancel}
						className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-accent"
					>
						{cancelLabel}
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className={`rounded-md px-3 py-1.5 text-sm font-semibold text-white ${
							confirmVariant === "danger"
								? "bg-red-600 hover:bg-red-700"
								: "bg-emerald-600 hover:bg-emerald-700"
						}`}
					>
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
