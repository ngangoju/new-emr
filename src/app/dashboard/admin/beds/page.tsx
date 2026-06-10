"use client";

import { useState } from "react";
import { useBeds, useWards, useCreateBed, useUpdateBed, useDeleteBed, Bed } from "@/hooks/useWardManagement";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Bed as BedIcon } from "lucide-react";

export default function BedsPage() {
    const { data: beds, isLoading: bedsLoading } = useBeds();
    const { data: wards, isLoading: wardsLoading } = useWards();
    const createBed = useCreateBed();
    const updateBed = useUpdateBed();
    const deleteBed = useDeleteBed();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBed, setEditingBed] = useState<Bed | null>(null);
    const [formData, setFormData] = useState({
        wardId: "",
        bedNumber: "",
        status: "AVAILABLE",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingBed) {
                await updateBed.mutateAsync({ id: editingBed.id, data: formData });
                alert("Bed updated successfully");
            } else {
                await createBed.mutateAsync(formData);
                alert("Bed created successfully");
            }
            setIsDialogOpen(false);
            resetForm();
        } catch {
            alert("Failed to save bed");
        }
    };

    const handleEdit = (bed: Bed) => {
        setEditingBed(bed);
        setFormData({
            wardId: bed.wardId,
            bedNumber: bed.bedNumber,
            status: bed.status,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this bed?")) {
            try {
                await deleteBed.mutateAsync(id);
                alert("Bed deleted successfully");
            } catch {
                alert("Failed to delete bed");
            }
        }
    };

    const resetForm = () => {
        setEditingBed(null);
        setFormData({ wardId: "", bedNumber: "", status: "AVAILABLE" });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "AVAILABLE":
                return "bg-green-500";
            case "OCCUPIED":
                return "bg-red-500";
            case "MAINTENANCE":
                return "bg-yellow-500";
            case "RESERVED":
                return "bg-blue-500";
            default:
                return "bg-gray-500";
        }
    };

    const getWardName = (wardId: string) => {
        return wards?.find(w => w.id === wardId)?.name || "Unknown";
    };

    if (bedsLoading || wardsLoading) {
        return <div className="p-8">Loading beds...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Bed Management</h1>
                    <p className="text-muted-foreground">Manage hospital beds and allocations</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Bed
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingBed ? "Edit Bed" : "Create New Bed"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="ward">Ward</Label>
                                <select
                                    id="ward"
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                    value={formData.wardId}
                                    onChange={(e) => setFormData({ ...formData, wardId: e.target.value })}
                                    required
                                >
                                    <option value="">Select a ward</option>
                                    {wards?.map((ward) => (
                                        <option key={ward.id} value={ward.id}>
                                            {ward.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bedNumber">Bed Number</Label>
                                <Input
                                    id="bedNumber"
                                    value={formData.bedNumber}
                                    onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <select
                                    id="status"
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="AVAILABLE">Available</option>
                                    <option value="OCCUPIED">Occupied</option>
                                    <option value="MAINTENANCE">Maintenance</option>
                                    <option value="RESERVED">Reserved</option>
                                </select>
                            </div>
                            <Button type="submit" className="w-full">
                                {editingBed ? "Update Bed" : "Create Bed"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BedIcon className="h-5 w-5" />
                        Beds ({beds?.length || 0})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bed Number</TableHead>
                                <TableHead>Ward</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {beds?.map((bed) => (
                                <TableRow key={bed.id}>
                                    <TableCell className="font-medium">{bed.bedNumber}</TableCell>
                                    <TableCell>{getWardName(bed.wardId)}</TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(bed.status)}>
                                            {bed.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleEdit(bed)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleDelete(bed.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!beds?.length && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No beds found. Click &quot;Add Bed&quot; to create one.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
