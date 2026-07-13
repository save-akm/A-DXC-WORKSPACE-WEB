"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Building2, Layers, Briefcase, Network, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/management/page-header";
import { StatCard } from "@/components/management/stat-card";
import { Pagination } from "@/components/management/pagination";
import { useMenuPermission } from "@/lib/hooks/use-menu-permission";
import { useToastStore } from "@/components/ui/toast/toast-store";
import {
  fetchOrgBranches, fetchOrgDepartments, fetchOrgPositions,
  fetchDepartmentUnits,
  createBranch, updateBranch, deleteBranch,
  createDepartment, updateDepartment, deleteDepartment,
  createDepartmentUnit, updateDepartmentUnit, deleteDepartmentUnit,
  createPosition, updatePosition, deletePosition,
  type Branch, type Department, type DepartmentUnit, type Position,
  type BranchCreateBody, type BranchUpdateBody,
  type DepartmentCreateBody, type DepartmentUpdateBody,
  type DepartmentUnitCreateBody, type DepartmentUnitUpdateBody,
  type PositionCreateBody, type PositionUpdateBody,
} from "@/lib/api/organization";

import { PAGE_SIZE } from "./_components/table-helpers";
import { OrgTabBar, TABS, type Tab } from "./_components/org-tab-bar";
import { BranchesTable }        from "./_components/branches-table";
import { DepartmentsTable }     from "./_components/departments-table";
import { DepartmentUnitsTable } from "./_components/department-units-table";
import { PositionsTable }       from "./_components/positions-table";
import { BranchModal }          from "./_components/branch-modal";
import { DepartmentModal }      from "./_components/department-modal";
import { UnitModal }            from "./_components/unit-modal";
import { PositionModal }        from "./_components/position-modal";
import { DeleteConfirmModal }   from "./_components/delete-confirm-modal";

// ─── Animation helpers ─────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: [0.4, 0, 0.2, 1] as const },
});

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OrganizationPage() {
  // ── Permissions ────────────────────────────────────────────────────────────
  const branchPerms   = useMenuPermission("branches");
  const deptPerms     = useMenuPermission("departments");
  const unitPerms     = useMenuPermission("department-units");
  const positionPerms = useMenuPermission("positions");

  const noBranchNode   = !branchPerms.canView   && !branchPerms.canCreate   && !branchPerms.canUpdate   && !branchPerms.canDelete;
  const noDeptNode     = !deptPerms.canView     && !deptPerms.canCreate     && !deptPerms.canUpdate     && !deptPerms.canDelete;
  const noUnitNode     = !unitPerms.canView     && !unitPerms.canCreate     && !unitPerms.canUpdate     && !unitPerms.canDelete;
  const noPositionNode = !positionPerms.canView && !positionPerms.canCreate && !positionPerms.canUpdate && !positionPerms.canDelete;

  const canCreateBranch   = noBranchNode   || branchPerms.canCreate;
  const canUpdateBranch   = noBranchNode   || branchPerms.canUpdate;
  const canDeleteBranch   = noBranchNode   || branchPerms.canDelete;

  const canCreateDept     = noDeptNode     || deptPerms.canCreate;
  const canUpdateDept     = noDeptNode     || deptPerms.canUpdate;
  const canDeleteDept     = noDeptNode     || deptPerms.canDelete;

  const canCreateUnit     = noUnitNode     || unitPerms.canCreate;
  const canUpdateUnit     = noUnitNode     || unitPerms.canUpdate;
  const canDeleteUnit     = noUnitNode     || unitPerms.canDelete;

  const canCreatePosition = noPositionNode || positionPerms.canCreate;
  const canUpdatePosition = noPositionNode || positionPerms.canUpdate;
  const canDeletePosition = noPositionNode || positionPerms.canDelete;

  const addToast = useToastStore((s) => s.add);

  // ── Tab + search ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>("branches");
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(1);

  // ── Data ───────────────────────────────────────────────────────────────────
  const [loading,         setLoading]         = useState(true);
  const [branches,        setBranches]        = useState<Branch[]>([]);
  const [departments,     setDepartments]     = useState<Department[]>([]);
  const [departmentUnits, setDepartmentUnits] = useState<DepartmentUnit[]>([]);
  const [positions,       setPositions]       = useState<Position[]>([]);

  // ── Branch modal state ─────────────────────────────────────────────────────
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [editingBranch,   setEditingBranch]   = useState<Branch | null>(null);
  const [branchToDelete,  setBranchToDelete]  = useState<Branch | null>(null);
  const [deletingBranch,  setDeletingBranch]  = useState(false);

  // ── Department modal state ─────────────────────────────────────────────────
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept,   setEditingDept]   = useState<Department | null>(null);
  const [deptToDelete,  setDeptToDelete]  = useState<Department | null>(null);
  const [deletingDept,  setDeletingDept]  = useState(false);

  // ── Unit modal state ───────────────────────────────────────────────────────
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit,   setEditingUnit]   = useState<DepartmentUnit | null>(null);
  const [unitToDelete,  setUnitToDelete]  = useState<DepartmentUnit | null>(null);
  const [deletingUnit,  setDeletingUnit]  = useState(false);

  // ── Position modal state ───────────────────────────────────────────────────
  const [positionModalOpen, setPositionModalOpen] = useState(false);
  const [editingPosition,   setEditingPosition]   = useState<Position | null>(null);
  const [positionToDelete,  setPositionToDelete]  = useState<Position | null>(null);
  const [deletingPosition,  setDeletingPosition]  = useState(false);

  // ── Data loading helpers ───────────────────────────────────────────────────

  const loadDepartments = useCallback(async () => {
    const depts = await fetchOrgDepartments();
    setDepartments(depts);

    const deptsWithUnits = depts.filter((d) => d.hasUnits);
    if (deptsWithUnits.length === 0) {
      setDepartmentUnits([]);
      return;
    }
    const unitLists = await Promise.all(
      deptsWithUnits.map(async (d) => {
        const units = await fetchDepartmentUnits(d.id);
        return units.map((u) => ({ ...u, departmentName: d.name }));
      }),
    );
    setDepartmentUnits(unitLists.flat());
  }, []);

  const refreshUnitsForDept = useCallback(async (departmentId: string, departmentName: string) => {
    const units = await fetchDepartmentUnits(departmentId);
    const enriched = units.map((u) => ({ ...u, departmentName }));
    setDepartmentUnits((prev) => [
      ...prev.filter((u) => u.departmentId !== departmentId),
      ...enriched,
    ]);
  }, []);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchOrgBranches(), fetchOrgDepartments(), fetchOrgPositions()])
      .then(async ([b, depts, p]) => {
        setBranches(b);
        setPositions(p);
        setDepartments(depts);
        const deptsWithUnits = depts.filter((d) => d.hasUnits);
        if (deptsWithUnits.length > 0) {
          const unitLists = await Promise.all(
            deptsWithUnits.map(async (d) => {
              const units = await fetchDepartmentUnits(d.id);
              return units.map((u) => ({ ...u, departmentName: d.name }));
            }),
          );
          setDepartmentUnits(unitLists.flat());
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(1); }, [activeTab, search]);

  // ── Filtered + paged ───────────────────────────────────────────────────────
  const filteredBranches = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? branches : branches.filter((b) =>
      b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q)
    );
  }, [branches, search]);

  const filteredDepartments = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? departments : departments.filter((d) =>
      d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)
    );
  }, [departments, search]);

  const filteredDepartmentUnits = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? departmentUnits : departmentUnits.filter((du) =>
      du.name.toLowerCase().includes(q) ||
      du.code.toLowerCase().includes(q) ||
      (du.departmentName?.toLowerCase() ?? "").includes(q)
    );
  }, [departmentUnits, search]);

  const filteredPositions = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? positions : positions.filter((p) =>
      p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
    );
  }, [positions, search]);

  const activeFiltered =
    activeTab === "branches"         ? filteredBranches        :
    activeTab === "departments"      ? filteredDepartments     :
    activeTab === "department-units" ? filteredDepartmentUnits :
                                       filteredPositions;

  const totalPages           = Math.max(1, Math.ceil(activeFiltered.length / PAGE_SIZE));
  const pagedBranches        = filteredBranches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pagedDepartments     = filteredDepartments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pagedDepartmentUnits = filteredDepartmentUnits.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pagedPositions       = filteredPositions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setSearch("");
  }

  // ── Branch CRUD ────────────────────────────────────────────────────────────
  function openCreateBranch() { setEditingBranch(null); setBranchModalOpen(true); }
  function openEditBranch(branch: Branch) { setEditingBranch(branch); setBranchModalOpen(true); }

  async function handleSaveBranch(body: BranchCreateBody | BranchUpdateBody) {
    if (editingBranch) {
      await updateBranch(editingBranch.id, body as BranchUpdateBody);
      addToast({ variant: "success", title: "Branch updated successfully" });
    } else {
      await createBranch(body as BranchCreateBody);
      addToast({ variant: "success", title: "Branch created successfully" });
    }
    setBranchModalOpen(false);
    setEditingBranch(null);
    fetchOrgBranches().then(setBranches);
  }

  async function handleDeleteBranch() {
    if (!branchToDelete) return;
    setDeletingBranch(true);
    try {
      await deleteBranch(branchToDelete.id);
      addToast({ variant: "success", title: `"${branchToDelete.name}" deleted` });
      setBranchToDelete(null);
      fetchOrgBranches().then(setBranches);
    } catch (err: unknown) {
      const e = err as { code?: string };
      addToast(e.code === "HAS_DEPARTMENTS"
        ? { variant: "error", title: "Cannot delete branch", description: "This branch still has departments assigned to it." }
        : { variant: "error", title: "Failed to delete branch" }
      );
    } finally {
      setDeletingBranch(false);
    }
  }

  // ── Department CRUD ────────────────────────────────────────────────────────
  function openCreateDept() { setEditingDept(null); setDeptModalOpen(true); }
  function openEditDept(dept: Department) { setEditingDept(dept); setDeptModalOpen(true); }

  async function handleSaveDept(body: DepartmentCreateBody | DepartmentUpdateBody) {
    if (editingDept) {
      await updateDepartment(editingDept.id, body as DepartmentUpdateBody);
      addToast({ variant: "success", title: "Department updated successfully" });
    } else {
      await createDepartment(body as DepartmentCreateBody);
      addToast({ variant: "success", title: "Department created successfully" });
    }
    setDeptModalOpen(false);
    setEditingDept(null);
    await loadDepartments();
  }

  async function handleDeleteDept() {
    if (!deptToDelete) return;
    setDeletingDept(true);
    try {
      await deleteDepartment(deptToDelete.id);
      addToast({ variant: "success", title: `"${deptToDelete.name}" deleted` });
      setDeptToDelete(null);
      await loadDepartments();
    } catch (err: unknown) {
      const e = err as { code?: string };
      addToast(
        e.code === "HAS_USERS" ? { variant: "error", title: "Cannot delete department", description: "This department still has users assigned to it." }
        : e.code === "HAS_UNITS" ? { variant: "error", title: "Cannot delete department", description: "This department still has units. Remove all units first." }
        : { variant: "error", title: "Failed to delete department" }
      );
    } finally {
      setDeletingDept(false);
    }
  }

  // ── Department Unit CRUD ───────────────────────────────────────────────────
  function openCreateUnit() { setEditingUnit(null); setUnitModalOpen(true); }
  function openEditUnit(unit: DepartmentUnit) { setEditingUnit(unit); setUnitModalOpen(true); }

  async function handleSaveUnit(
    departmentId: string,
    body: DepartmentUnitCreateBody | DepartmentUnitUpdateBody,
  ) {
    const deptName = departments.find((d) => d.id === departmentId)?.name
      ?? editingUnit?.departmentName
      ?? "";

    if (editingUnit) {
      await updateDepartmentUnit(editingUnit.departmentId, editingUnit.id, body as DepartmentUnitUpdateBody);
      addToast({ variant: "success", title: "Unit updated successfully" });
    } else {
      await createDepartmentUnit(departmentId, body as DepartmentUnitCreateBody);
      addToast({ variant: "success", title: "Unit created successfully" });
    }
    setUnitModalOpen(false);
    setEditingUnit(null);
    await refreshUnitsForDept(
      editingUnit ? editingUnit.departmentId : departmentId,
      deptName,
    );
  }

  async function handleDeleteUnit() {
    if (!unitToDelete) return;
    setDeletingUnit(true);
    try {
      await deleteDepartmentUnit(unitToDelete.departmentId, unitToDelete.id);
      addToast({ variant: "success", title: `"${unitToDelete.name}" deleted` });
      setUnitToDelete(null);
      await refreshUnitsForDept(unitToDelete.departmentId, unitToDelete.departmentName ?? "");
    } catch (err: unknown) {
      const e = err as { code?: string };
      addToast(e.code === "HAS_USERS"
        ? { variant: "error", title: "Cannot delete unit", description: "This unit still has users assigned to it." }
        : { variant: "error", title: "Failed to delete unit" }
      );
    } finally {
      setDeletingUnit(false);
    }
  }

  // ── Position CRUD ──────────────────────────────────────────────────────────
  function openCreatePosition() { setEditingPosition(null); setPositionModalOpen(true); }
  function openEditPosition(pos: Position) { setEditingPosition(pos); setPositionModalOpen(true); }

  async function handleSavePosition(body: PositionCreateBody | PositionUpdateBody) {
    if (editingPosition) {
      await updatePosition(editingPosition.id, body as PositionUpdateBody);
      addToast({ variant: "success", title: "Position updated successfully" });
    } else {
      await createPosition(body as PositionCreateBody);
      addToast({ variant: "success", title: "Position created successfully" });
    }
    setPositionModalOpen(false);
    setEditingPosition(null);
    fetchOrgPositions().then(setPositions);
  }

  async function handleDeletePosition() {
    if (!positionToDelete) return;
    setDeletingPosition(true);
    try {
      await deletePosition(positionToDelete.id);
      addToast({ variant: "success", title: `"${positionToDelete.name}" deleted` });
      setPositionToDelete(null);
      fetchOrgPositions().then(setPositions);
    } catch (err: unknown) {
      const e = err as { code?: string };
      addToast(e.code === "HAS_USERS"
        ? { variant: "error", title: "Cannot delete position", description: "This position still has users assigned to it." }
        : { variant: "error", title: "Failed to delete position" }
      );
    } finally {
      setDeletingPosition(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-shell">

      {/* Header */}
      <PageHeader
        icon={Network}
        title="Organization"
        subtitle="Manage branches, departments, department units, and positions"
        actions={
          <>
            {activeTab === "branches"         && canCreateBranch   && (
              <Button variant="create" size="lg" onClick={openCreateBranch}>
                <Plus /><span className="hidden sm:inline">Add Branch</span><span className="sm:hidden">Add</span>
              </Button>
            )}
            {activeTab === "departments"      && canCreateDept     && (
              <Button variant="create" size="lg" onClick={openCreateDept}>
                <Plus /><span className="hidden sm:inline">Add Department</span><span className="sm:hidden">Add</span>
              </Button>
            )}
            {activeTab === "department-units" && canCreateUnit     && (
              <Button variant="create" size="lg" onClick={openCreateUnit}>
                <Plus /><span className="hidden sm:inline">Add Unit</span><span className="sm:hidden">Add</span>
              </Button>
            )}
            {activeTab === "positions"        && canCreatePosition && (
              <Button variant="create" size="lg" onClick={openCreatePosition}>
                <Plus /><span className="hidden sm:inline">Add Position</span><span className="sm:hidden">Add</span>
              </Button>
            )}
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <motion.div {...fadeUp(0.08)}><StatCard icon={MapPin}    label="Branches"    value={branches.length}        gradient="from-amber-500 to-orange-500"  /></motion.div>
        <motion.div {...fadeUp(0.14)}><StatCard icon={Building2} label="Departments" value={departments.length}     gradient="from-sky-500 to-blue-600"       /></motion.div>
        <motion.div {...fadeUp(0.20)}><StatCard icon={Layers}    label="Dept. Units" value={departmentUnits.length} gradient="from-violet-500 to-fuchsia-500" /></motion.div>
        <motion.div {...fadeUp(0.26)}><StatCard icon={Briefcase} label="Positions"   value={positions.length}       gradient="from-emerald-500 to-teal-500"   /></motion.div>
      </div>

      {/* Toolbar */}
      <motion.div {...fadeUp(0.32)} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-72">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder={`Search ${TABS.find((t) => t.id === activeTab)?.label.toLowerCase()}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <OrgTabBar activeTab={activeTab} onChange={handleTabChange} />
      </motion.div>

      {/* Table */}
      <motion.div {...fadeUp(0.40)}>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {activeTab === "branches" && (
                    <BranchesTable
                      rows={pagedBranches} loading={loading} page={page}
                      onEdit={openEditBranch} onDelete={setBranchToDelete}
                      canUpdate={canUpdateBranch} canDelete={canDeleteBranch}
                    />
                  )}
                  {activeTab === "departments" && (
                    <DepartmentsTable
                      rows={pagedDepartments} loading={loading} page={page}
                      onEdit={openEditDept} onDelete={setDeptToDelete}
                      canUpdate={canUpdateDept} canDelete={canDeleteDept}
                    />
                  )}
                  {activeTab === "department-units" && (
                    <DepartmentUnitsTable
                      rows={pagedDepartmentUnits} loading={loading} page={page}
                      onEdit={openEditUnit} onDelete={setUnitToDelete}
                      canUpdate={canUpdateUnit} canDelete={canDeleteUnit}
                    />
                  )}
                  {activeTab === "positions" && (
                    <PositionsTable
                      rows={pagedPositions} loading={loading} page={page}
                      onEdit={openEditPosition} onDelete={setPositionToDelete}
                      canUpdate={canUpdatePosition} canDelete={canDeletePosition}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            <Pagination
              page={page} totalPages={totalPages} total={activeFiltered.length}
              pageSize={PAGE_SIZE} onChange={setPage}
              layoutId="org-page-active-bg" itemLabel="items"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Branch Modals */}
      <BranchModal
        open={branchModalOpen}
        onClose={() => { setBranchModalOpen(false); setEditingBranch(null); }}
        onSave={handleSaveBranch}
        branch={editingBranch}
      />
      <DeleteConfirmModal
        itemType="Branch" name={branchToDelete?.name ?? ""}
        open={!!branchToDelete} deleting={deletingBranch}
        onConfirm={handleDeleteBranch} onCancel={() => setBranchToDelete(null)}
      />

      {/* Department Modals */}
      <DepartmentModal
        open={deptModalOpen}
        onClose={() => { setDeptModalOpen(false); setEditingDept(null); }}
        onSave={handleSaveDept}
        department={editingDept}
        branches={branches}
      />
      <DeleteConfirmModal
        itemType="Department" name={deptToDelete?.name ?? ""}
        open={!!deptToDelete} deleting={deletingDept}
        onConfirm={handleDeleteDept} onCancel={() => setDeptToDelete(null)}
      />

      {/* Unit Modals */}
      <UnitModal
        open={unitModalOpen}
        onClose={() => { setUnitModalOpen(false); setEditingUnit(null); }}
        onSave={handleSaveUnit}
        unit={editingUnit}
        departments={departments}
      />
      <DeleteConfirmModal
        itemType="Unit" name={unitToDelete?.name ?? ""}
        open={!!unitToDelete} deleting={deletingUnit}
        onConfirm={handleDeleteUnit} onCancel={() => setUnitToDelete(null)}
      />

      {/* Position Modals */}
      <PositionModal
        open={positionModalOpen}
        onClose={() => { setPositionModalOpen(false); setEditingPosition(null); }}
        onSave={handleSavePosition}
        position={editingPosition}
      />
      <DeleteConfirmModal
        itemType="Position" name={positionToDelete?.name ?? ""}
        open={!!positionToDelete} deleting={deletingPosition}
        onConfirm={handleDeletePosition} onCancel={() => setPositionToDelete(null)}
      />
    </div>
  );
}
