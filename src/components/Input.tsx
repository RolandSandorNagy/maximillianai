type Props = {
  children: string;
};

export const Input = (props: Props) => (
  <p className="p-2 my-2" {...props} />
);
