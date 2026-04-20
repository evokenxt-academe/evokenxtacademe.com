import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconBook2, IconShoppingCart } from "@tabler/icons-react";

const cartItems = [
  {
    id: "acca-core",
    name: "ACCA Core Financial Reporting",
    level: "professional",
    price: 4999,
    originalPrice: 6999,
  },
  {
    id: "acca-strategy",
    name: "Strategic Performance Management",
    level: "advanced",
    price: 3499,
    originalPrice: null,
  },
];

export default function CartPage() {
  const subtotal = cartItems.reduce((total, item) => total + item.price, 0);
  const savings = cartItems.reduce(
    (total, item) =>
      total + Math.max(0, (item.originalPrice ?? item.price) - item.price),
    0,
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
      <section className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit">
          Course cart
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Review your selected courses
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Keep the cart clean and readable so students can review pricing,
          savings, and the next step without noise.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Cart items</CardTitle>
            <CardDescription>
              The courses you are about to enroll in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cartItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cartItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                            <IconBook2 />
                          </div>
                          <span>{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.level}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">₹{item.price}</div>
                        {item.originalPrice ? (
                          <div className="text-sm text-muted-foreground line-through">
                            ₹{item.originalPrice}
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Empty className="rounded-lg border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconShoppingCart />
                  </EmptyMedia>
                  <EmptyTitle>Your cart is empty</EmptyTitle>
                  <EmptyDescription>
                    Browse the catalog and add courses before checking out.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button asChild>
                    <Link href="/courses">Browse courses</Link>
                  </Button>
                </EmptyContent>
              </Empty>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
            <CardDescription>
              Simple pricing details before enrollment.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Savings</span>
              <span>₹{savings}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span>₹{subtotal}</span>
            </div>
            <Button className="w-full">Proceed to checkout</Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/courses">Continue shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
