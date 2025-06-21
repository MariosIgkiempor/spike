import { FC, PropsWithChildren } from 'react';

export const PageSection: FC<PropsWithChildren> = ({ children }) => {
    return <div className={'space-y-6'}>{children}</div>;
};
