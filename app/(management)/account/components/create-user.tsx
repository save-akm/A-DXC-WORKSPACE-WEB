"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { AvatarPicker } from "./avatar-picker";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { getRole } from "@/app/store/features/role.slice";
import { createUser, getUsers } from "@/app/store/features/userSlice";
import { UserCreateInterface } from "@/app/types/interface/user.interface";
import { useUserContext } from "@/app/context/user-content";
import { useStatusModal } from "@/app/context/status-modal-context";

const formSchema = z.object({
  avatar: z.string().min(1, {
    message: "Please select an avatar.",
  }),
  roleID: z.string().min(1, {
    message: "Role Name must be at least 1 characters.",
  }),
  password: z.string().min(1, {
    message: "Password must be at least 1 characters.",
  }),
  empID: z
    .string()
    .min(1, {
      message: "Employee ID must be at least 10 characters.",
    })
    .max(11, {
      message: "Employee ID must not be longer than 30 characters.",
    }),
  fullName: z.string().min(1, {
    message: "Full Name must be at least 1 characters.",
  }),
  email: z
    .string()
    .min(1, {
      message: "Email is required.",
    })
    .refine(
      (value) =>
        value.endsWith("@hlas.co.th") ||
        value.endsWith("@honda.th.com") ||
        value.endsWith("@th.yusen-logistics.com"),
      {
        message:
          "Email must end with '@hlas.co.th' or '@honda.th.com' or '@th.yusen-logistics.com'.",
      }
    ),
  dept: z.string().min(1, {
    message: "Department must be at least 1 characters.",
  }),
});

export function CreateUser() {
  const { setActiveTab } = useUserContext();
  const handleStatusModal = useStatusModal();
  const [showPassword, setShowPassword] = useState(false);
  const roles = useAppSelector(state => state.role.roles);
  const isLoading = useAppSelector(state => state.user.isLoading);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getRole());
  }, [dispatch]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      avatar: "",
      roleID: "",
      password: "",
      empID: "",
      fullName: "",
      email: "",
      dept: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const userData: UserCreateInterface = {
      avatar: values.avatar,
      roleID: values.roleID,
      password: values.password,
      empID: values.empID,
      fullName: values.fullName,
      email: values.email,
      dept: values.dept,
    };

    dispatch(createUser(userData))
      .unwrap()
      .then((response) => {
        if (response.data) {
          // Refresh data ทันที แล้วแสดง modal
          dispatch(getUsers());
          handleStatusModal(
            "Create User Success",
            response.message,
            "success",
            () => setActiveTab("all")
          );
          form.reset();
        } else {
          handleStatusModal(
            "Create User Failed",
            response.message,
            "warning"
          );
        }
      })
      .catch((err) => {
        handleStatusModal(
          "Create User Failed",
          err.message,
          "warning"
        );
      });
  }

  return (
    <Form {...form}>

        <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid md:grid-cols-2 gap-4"
        >
            <div className="w-full col-span-2">
                 <FormField
                    control={form.control}
                    name="avatar"
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <AvatarPicker
                                value={field.value}
                                onChange={field.onChange}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            </div>
            <FormField
            control={form.control}
            name="roleID"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel htmlFor="editroleId">Role</FormLabel>
                <FormControl>
                    <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    >
                    <FormControl className="w-full cursor-pointer">
                        <SelectTrigger>
                        <SelectValue placeholder="Select a Role" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {roles.map((role,index) => (
                            <SelectItem value={role.roleID.toString()} key={index}>{role.roleName}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="empID"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel htmlFor="editempId">Employee ID</FormLabel>
                <FormControl>
                    <Input
                    placeholder="Employee ID"
                    id="editempId"
                    {...field}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel htmlFor="editEmail">Email</FormLabel>
                <FormControl>
                    <Input placeholder="Email" id="editEmail" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel htmlFor="edituserId">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      placeholder="Password" 
                      id="edituserId" 
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      {...field} />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-black/70"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                </div>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel htmlFor="editfullName">Full Name</FormLabel>
                <FormControl>
                    <Input
                    placeholder="Full Name"
                    id="editfullName"
                    {...field}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="dept"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel htmlFor="editDepartment">Department</FormLabel>
                <FormControl>
                    <Input
                    placeholder="Department"
                    id="editDepartment"
                    {...field}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button
            type="submit"
            className="w-full self-end gradient-completion text-white"
            disabled={isLoading}
            >
            Submit
            </Button>
        </form>
        </Form>
  );
}
