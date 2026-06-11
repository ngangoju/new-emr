"use client";

import { useState } from "react";
import { useWards, useCreateWard, useUpdateWard, useDeleteWard, Ward } from "@/hooks/useWardManagement";
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
import { Pencil, Trash2, Plus, Building2 } from "lucide-react";
import toast from "react-hot-toast";

export default function WardsPage() {
    const { data: wards, isLoading } = useWards();
    const createWard = useCreateWard();
    const updateWard = useUpdateWard();
    const deleteWard = useDeleteWard();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingWard, setEditingWard] = useState<Ward | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        floor: 0,
        capacity: 10,
        status: "ACTIVE",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingWard) {
                await updateWard.mutateAsync({ id: editingWard.id, data: formData });
                toast.success("Ward updated successfully");
            } else {
                await createWard.mutateAsync(formData);
                toast.success("Ward created successfully");
            }
            setIsDialogOpen(false);
            resetForm();
        } catch {
            toast.error("Failed to save ward");
        }
    };

    const handleEdit = (ward: Ward) => {
        setEditingWard(ward);
        setFormData({
            name: ward.name,
            floor: ward.floor,
            capacity: ward.capacity,
            status: ward.status,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this ward?")) {
            try {
                await deleteWard.mutateAsync(id);
                toast.success("Ward deleted successfully");
            } catch {
                toast.error("Failed to delete ward");
            }
        }
    };

    const resetForm = () => {
        setEditingWard(null);
        setFormData({ name: "", floor: 0, capacity: 10, status: "ACTIVE" });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return "bg-green-500";
            case "INACTIVE":
                return "bg-gray-500";
            case "MAINTENANCE":
                return "bg-yellow-500";
            default:
                return "bg-gray-500";
        }
    };

    if (isLoading) {
        return <div className="p-8">Loading wards...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Ward Management</h1>
                    <p className="text-muted-foreground">Manage hospital wards and bed allocations</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Ward
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingWard ? "Edit Ward" : "Create New Ward"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Ward Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="floor">Floor</Label>
                                    <Input
                                        id="floor"
                                        type="number"
                                        value={formData.floor}
                                        onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="capacity">Capacity</Label>
                                    <Input
                                        id="capacity"
                                        type="number"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <select
                                    id="status"
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                    <option value="MAINTENANCE">Maintenance</option>
                                </select>
                            </div>
                            <Button type="submit" className="w-full">
                                {editingWard ? "Update Ward" : "Create Ward"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Wards ({wards?.length || 0})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Floor</TableHead>
                                <TableHead>Capacity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {wards?.map((ward) => (
                                <TableRow key={ward.id}>
                                    <TableCell className="font-medium">{ward.name}</TableCell>
                                    <TableCell>Floor {ward.floor}</TableCell>
                                    <TableCell>{ward.capacity} beds</TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(ward.status)}>
                                            {ward.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleEdit(ward)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleDelete(ward.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!wards?.length && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No wards found. Click &quot;Add Ward&quot; to create one.
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
