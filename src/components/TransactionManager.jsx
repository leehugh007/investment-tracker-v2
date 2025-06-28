import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

const TransactionManager = ({ transactions, onTransactionsUpdate }) => {
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // 刪除交易功能 (按照架構文檔設計)
  const deleteTransaction = (transactionId) => {
    const existingTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const updatedTransactions = existingTransactions.filter(tx => tx.id !== transactionId);
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
    
    // 通知父組件更新
    if (onTransactionsUpdate) {
      onTransactionsUpdate(updatedTransactions);
    }
    
    setDeleteConfirm(null);
  };

  // 確認刪除對話框
  const ConfirmDialog = ({ transaction, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <AlertTriangle className="text-red-500 mr-3" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">確認刪除交易</h3>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">您確定要刪除以下交易記錄嗎？此操作無法復原。</p>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">股票:</span>
                <span className="ml-2 font-medium">{transaction.symbol}</span>
              </div>
              <div>
                <span className="text-gray-500">類型:</span>
                <span className={`ml-2 font-medium ${
                  transaction.type === 'BUY' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'BUY' ? '買入' : '賣出'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">數量:</span>
                <span className="ml-2 font-medium">{transaction.quantity} 股</span>
              </div>
              <div>
                <span className="text-gray-500">價格:</span>
                <span className="ml-2 font-medium">
                  {transaction.price} {transaction.currency}
                </span>
              </div>
              <div>
                <span className="text-gray-500">日期:</span>
                <span className="ml-2 font-medium">{transaction.date}</span>
              </div>
              <div>
                <span className="text-gray-500">總額:</span>
                <span className="ml-2 font-medium">
                  {(transaction.quantity * transaction.price).toLocaleString()} {transaction.currency}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => onConfirm(transaction.id)}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            確認刪除
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );

  // 刪除按鈕組件
  const DeleteButton = ({ transaction }) => (
    <button
      onClick={() => setDeleteConfirm(transaction)}
      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      title="刪除交易"
    >
      <Trash2 size={16} />
    </button>
  );

  return (
    <>
      {/* 刪除按鈕 - 可以在交易列表中使用 */}
      <div className="transaction-manager">
        {transactions.map(transaction => (
          <div key={transaction.id} className="flex items-center justify-between">
            {/* 交易信息顯示區域 - 由父組件處理 */}
            <div className="flex-1">
              {/* 這裡會由父組件填入交易顯示內容 */}
            </div>
            
            {/* 操作按鈕區域 */}
            <div className="flex items-center space-x-2">
              <DeleteButton transaction={transaction} />
            </div>
          </div>
        ))}
      </div>

      {/* 確認刪除對話框 */}
      {deleteConfirm && (
        <ConfirmDialog
          transaction={deleteConfirm}
          onConfirm={deleteTransaction}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </>
  );
};

// 導出刪除按鈕組件，供其他組件使用
export const DeleteTransactionButton = ({ transaction, onDelete }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    const existingTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const updatedTransactions = existingTransactions.filter(tx => tx.id !== transaction.id);
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
    
    if (onDelete) {
      onDelete(transaction.id);
    }
    
    setShowConfirm(false);
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="刪除交易"
      >
        <Trash2 size={16} />
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="text-red-500 mr-3" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">確認刪除交易</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">您確定要刪除以下交易記錄嗎？此操作無法復原。</p>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">股票:</span>
                    <span className="ml-2 font-medium">{transaction.symbol}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">類型:</span>
                    <span className={`ml-2 font-medium ${
                      transaction.type === 'BUY' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'BUY' ? '買入' : '賣出'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">數量:</span>
                    <span className="ml-2 font-medium">{transaction.quantity} 股</span>
                  </div>
                  <div>
                    <span className="text-gray-500">價格:</span>
                    <span className="ml-2 font-medium">
                      {transaction.price} {transaction.currency}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">日期:</span>
                    <span className="ml-2 font-medium">{transaction.date}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">總額:</span>
                    <span className="ml-2 font-medium">
                      {(transaction.quantity * transaction.price).toLocaleString()} {transaction.currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                確認刪除
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransactionManager;

