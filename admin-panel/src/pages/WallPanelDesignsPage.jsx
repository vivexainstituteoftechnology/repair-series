import { WallPanelDesignStudio } from '../components/WallPanelDesignStudio'

export function WallPanelDesignsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--outline-variant)]/60 pb-4">
        <h1 className="text-2xl font-bold text-[var(--on-surface)]">Wall Panel Designs</h1>
        <p className="mt-1 text-sm text-[var(--on-surface-variant)]">
          Manage wall panel catalog designs, photos (upload files or add image URLs), descriptions, and published status.
        </p>
      </div>
      <WallPanelDesignStudio />
    </div>
  )
}
