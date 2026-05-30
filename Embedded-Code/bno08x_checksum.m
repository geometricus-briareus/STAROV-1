function isValid = bno08x_checksum(packet, checksumBytes)
%#codegen

sum = uint16(0);
for i = 1:numel(packet)
    sum = sum + uint16(packet(i));
end
checksum = uint8(mod(sum, 256));

isValid = (checksum == checksumBytes(1));

end