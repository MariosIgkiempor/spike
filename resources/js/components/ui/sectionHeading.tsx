import { FC, PropsWithChildren } from 'react';

export const SectionHeading: FC<PropsWithChildren> = ({ children }) => {
    return <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{children}</h2>;
};
