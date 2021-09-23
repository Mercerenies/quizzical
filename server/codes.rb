
# Code generator
module Codes

  def self.sample_letter
    # Omit vowels (it's easier than censoring every cuss word I can
    # think of)
    %w[B C D F G H J K L M N P Q R S T V W X Z].sample
  end

  # Argument can be any object that responds to :include?.
  def self.generate(forbidden = [])
    begin
      candidate = 4.times.map { Codes.sample_letter }.join
    end while forbidden.include? candidate
    candidate
  end

end
