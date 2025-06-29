import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/formError';
import { FormField } from '@/components/ui/formField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { FC, FormEvent } from 'react';

export const NewLeagueForm: FC = () => {
    const form = useForm({
        name: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('api.leagues.store'), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
            },
            onError: () => {
                //
            },
        });
    };

    return (
        <form onSubmit={handleSubmit} className={'block space-y-4'}>
            <FormField>
                <Label htmlFor={'name'}>League Name</Label>
                <Input
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                    name={'name'}
                    placeholder={"Make sure it's a good pun"}
                />
                <FormError>{form.errors.name}</FormError>
            </FormField>

            <Button type={'submit'} disabled={form.processing}>
                Submit
            </Button>
        </form>
    );
};
