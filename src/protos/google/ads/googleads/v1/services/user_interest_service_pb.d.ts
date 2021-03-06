// package: google.ads.googleads.v1.services
// file: google/ads/googleads/v1/services/user_interest_service.proto

import * as jspb from "google-protobuf";
import * as google_ads_googleads_v1_resources_user_interest_pb from "../../../../../google/ads/googleads/v1/resources/user_interest_pb";
import * as google_api_annotations_pb from "../../../../../google/api/annotations_pb";

export class GetUserInterestRequest extends jspb.Message {
  getResourceName(): string;
  setResourceName(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetUserInterestRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetUserInterestRequest): GetUserInterestRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetUserInterestRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetUserInterestRequest;
  static deserializeBinaryFromReader(message: GetUserInterestRequest, reader: jspb.BinaryReader): GetUserInterestRequest;
}

export namespace GetUserInterestRequest {
  export type AsObject = {
    resourceName: string,
  }
}

