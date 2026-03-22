import * as React from 'react';
import { flexRender, Row, Table as TableInstance } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

interface DataTableProps<TData> {
    table: TableInstance<TData>;
    renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode;
    onRowClick?: (row: Row<TData>) => void;
}

export function DataTable<TData>({ table, renderSubComponent, onRowClick }: DataTableProps<TData>) {
    return (
        <div className="">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <React.Fragment key={row.id}>
                                <TableRow
                                    className={onRowClick ? 'cursor-pointer' : ''}
                                    onClick={() => onRowClick?.(row)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                                {renderSubComponent && row.getIsExpanded() && (
                                    <TableRow>
                                        <TableCell colSpan={row.getVisibleCells().length} className="p-0">
                                            {renderSubComponent({ row })}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
