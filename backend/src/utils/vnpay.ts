import crypto from 'crypto';
import moment from 'moment';
import qs from 'qs';

/**
 * Tiện ích hỗ trợ tích hợp cổng thanh toán VNPay
 */
export class VNPayUtils {
  private static tmnCode = process.env.VNP_TMN_CODE || '';
  private static hashSecret = process.env.VNP_HASH_SECRET || '';
  private static vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  private static returnUrl = process.env.VNP_RETURN_URL || '';

  /**
   * Tạo URL thanh toán VNPay
   */
  static createPaymentUrl(params: {
    amount: number;
    orderId: string;
    orderInfo: string;
    ipAddr: string;
    createDate?: string;
  }): string {
    const date = params.createDate || moment().utcOffset(7).format('YYYYMMDDHHmmss');
    const expireDate = moment().utcOffset(7).add(15, 'minutes').format('YYYYMMDDHHmmss');
    
    let vnp_Params: any = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: params.orderId,
      vnp_OrderInfo: params.orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: params.amount * 100, // VNPay dùng đơn vị xu (VNĐ * 100)
      vnp_ReturnUrl: this.returnUrl,
      vnp_IpAddr: params.ipAddr,
      vnp_CreateDate: date,
      vnp_ExpireDate: expireDate,
    };

    // Sắp xếp các tham số theo alphabet (Yêu cầu của VNPay)
    vnp_Params = this.sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnp_Params['vnp_SecureHash'] = signed;

    return this.vnpUrl + '?' + qs.stringify(vnp_Params, { encode: false });
  }

  /**
   * Kiểm tra tính hợp lệ của dữ liệu phản hồi từ VNPay (Checksum)
   */
  static verifyReturnUrl(vnp_Params: any): boolean {
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const sortedParams = this.sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return secureHash === signed;
  }

  private static sortObject(obj: any) {
    const sorted: any = {};
    const str = [];
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (let i = 0; i < str.length; i++) {
        const key = str[i];
        if (key) {
           sorted[key] = encodeURIComponent(obj[decodeURIComponent(key)]).replace(/%20/g, "+");
        }
    }
    return sorted;
  }
}
