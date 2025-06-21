import { FC, PropsWithChildren } from 'react';

export const FormError: FC<PropsWithChildren> = ({ children }) => {
    if (!children) {
        return null;
    }

    return <div className={'text-destructive-foreground'}>{children}</div>;
};
