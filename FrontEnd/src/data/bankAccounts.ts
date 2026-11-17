
export type BankAccount = {
  id: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  color: string;
};

export const bankAccounts: BankAccount[] = [
  {
    id: 1,
    bankName: "Bank BRI",
    accountNumber: "000000000000000",
    accountName: "NAMA PEMILIK REKENING",
    color: "bg-blue-50 text-blue-700",
  },
  {
    id: 2,
    bankName: "Bank BCA",
    accountNumber: "000000000000000",
    accountName: "NAMA PEMILIK REKENING",
    color: "bg-blue-50 text-blue-700",
  },
  {
    id: 3,
    bankName: "Bank Mandiri",
    accountNumber: "000000000000000",
    accountName: "NAMA PEMILIK REKENING",
    color: "bg-yellow-50 text-yellow-700",
  },
  {
    id: 4,
    bankName: "Bank BNI",
    accountNumber: "000000000000000",
    accountName: "NAMA PEMILIK REKENING",
    color: "bg-orange-50 text-orange-700",
  },
];
